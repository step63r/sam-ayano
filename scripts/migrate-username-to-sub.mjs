#!/usr/bin/env node
/**
 * Books / RentalBook / AtomicNumber のユーザー識別子を、メールアドレスから Cognito の sub に移行する。
 *
 * 使い方（リポジトリ直下で実行）:
 *   node scripts/migrate-username-to-sub.mjs copy              # dry-run（何も書き込まない）
 *   node scripts/migrate-username-to-sub.mjs copy --execute    # 新キーの行を作る（旧キーの行は残す）
 *   node scripts/migrate-username-to-sub.mjs cleanup           # dry-run
 *   node scripts/migrate-username-to-sub.mjs cleanup --execute # 新キーの行があることを確認して旧キーの行を消す
 *
 * 依存パッケージを増やさないため、AWS SDK ではなく AWS CLI（v2）を呼び出す。
 * AWS CLI の scan が返す DynamoDB JSON をそのまま使えるので、型変換が不要になる。
 * 実行前に、対象3テーブルのオンデマンドバックアップを取ること。
 * copy は旧キーの行を消さないので、バックエンドを戻せば元の状態で動く（RentalBook を除く。下記）。
 *
 * RentalBook は GSI のキー（lender_username）を含むため、コピーではなくその場で書き換える。
 * 戻せるように、元の値を legacy_lender_username / legacy_renter_username に残す。
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REGION = process.env.AWS_REGION ?? "ap-northeast-1";
const USER_POOL_ID = process.env.USER_POOL_ID ?? "ap-northeast-1_CouspoB7q";
const BATCH_SIZE = 25; // BatchWriteItem の上限

const [phase, ...flags] = process.argv.slice(2);
const execute = flags.includes("--execute");

if (!["copy", "cleanup"].includes(phase)) {
    console.error("使い方: node scripts/migrate-username-to-sub.mjs <copy|cleanup> [--execute]");
    process.exit(1);
}

/** AWS CLI を呼び、JSON の出力を返す。出力が無ければ undefined */
const aws = (...args) => {
    const out = execFileSync("aws", [...args, "--region", REGION, "--output", "json"], {
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        // Windows の既定（cp932）のままだと、日本語を含む書籍データの入出力で AWS CLI が失敗する
        env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", AWS_CLI_FILE_ENCODING: "utf-8" },
    });
    return out.trim() === "" ? undefined : JSON.parse(out);
};

/** 本文を JSON ファイル経由で渡す。書籍データは長く、コマンドライン引数だと Windows の長さ上限（約 32K 文字）を超えうるため */
const awsWithJsonFile = (command, optionName, body) => {
    const dir = mkdtempSync(join(tmpdir(), "migrate-"));
    try {
        const file = join(dir, "body.json");
        writeFileSync(file, JSON.stringify(body), "utf8");
        return aws("dynamodb", command, optionName, `file://${file}`);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
};

/** Cognito のメールアドレス（小文字）→ sub の対応表を作る。QR の btoa(loginId) 由来の大文字小文字の揺れを吸収するため小文字で比べる */
const loadUserMap = () => {
    const { Users } = aws("cognito-idp", "list-users", "--user-pool-id", USER_POOL_ID);
    const emailToSub = new Map();
    for (const user of Users) {
        const attr = (name) => user.Attributes.find((a) => a.Name === name)?.Value;
        const email = attr("email");
        const sub = attr("sub");
        if (email && sub) {
            emailToSub.set(email.toLowerCase(), sub);
        }
    }
    return emailToSub;
};

const scan = (tableName) => aws("dynamodb", "scan", "--table-name", tableName).Items;

/** BatchWriteItem を 25 件ずつ流す。未処理分は、全件が通るまで再送する */
const batchWrite = (tableName, requests) => {
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        let pending = { [tableName]: requests.slice(i, i + BATCH_SIZE) };
        for (let attempt = 0; Object.keys(pending).length > 0; attempt++) {
            if (attempt >= 10) {
                throw new Error(`BatchWriteItem の未処理分が解消しません: ${tableName}`);
            }
            const result = awsWithJsonFile("batch-write-item", "--request-items", pending);
            pending = result?.UnprocessedItems ?? {};
            if (Object.keys(pending).length > 0) {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500 * (attempt + 1));
            }
        }
    }
};

const bookKey = (item) => `${item.username.S}#${item.seqno.N}`;

const report = (label, list) => {
    console.log(`${label}: ${list.length} 件`);
    for (const line of list) {
        console.log(`  - ${line}`);
    }
};

const emailToSub = loadUserMap();
const subs = new Set(emailToSub.values());
console.log(`Cognito ユーザー: ${emailToSub.size} 人 / モード: ${execute ? "実行" : "dry-run"} / フェーズ: ${phase}`);

const books = scan("Books");
const booksByKey = new Set(books.map(bookKey));

if (phase === "copy") {
    // --- Books: 新キーの行を作る。既にある行は上書きしない（バックエンド切り替え後に再実行されても、更新済みの行を壊さないため）
    const toPut = [];
    const unmapped = new Set();
    let alreadyMigrated = 0;
    let alreadyExists = 0;
    for (const item of books) {
        const owner = item.username.S;
        if (subs.has(owner)) {
            alreadyMigrated++;
            continue;
        }
        const sub = emailToSub.get(owner.toLowerCase());
        if (!sub) {
            unmapped.add(owner);
            continue;
        }
        const migrated = { ...item, username: { S: sub } };
        if (booksByKey.has(bookKey(migrated))) {
            alreadyExists++;
            continue;
        }
        toPut.push(migrated);
    }
    console.log(`Books: 全 ${books.length} 件 / 作成対象 ${toPut.length} 件 / 移行済み ${alreadyMigrated} 件 / 新キーが既にある ${alreadyExists} 件`);
    report("Books: Cognito に存在しない username（対象外）", [...unmapped]);
    if (execute && toPut.length > 0) {
        batchWrite("Books", toPut.map((Item) => ({ PutRequest: { Item } })));
        console.log(`Books: ${toPut.length} 件を作成しました`);
    }

    // --- AtomicNumber: Books-<email> → Books-<sub>。新キーが既にあれば上書きしない（採番が巻き戻るのを防ぐため）
    const counters = scan("AtomicNumber");
    const existingCounters = new Set(counters.map((c) => c.name.S));
    const counterPuts = [];
    for (const counter of counters) {
        const match = /^Books-(.+)$/.exec(counter.name.S);
        const sub = match && emailToSub.get(match[1].toLowerCase());
        if (!sub || existingCounters.has(`Books-${sub}`)) {
            continue;
        }
        counterPuts.push({ ...counter, name: { S: `Books-${sub}` } });
    }
    console.log(`AtomicNumber: 作成対象 ${counterPuts.length} 件`);
    for (const c of counterPuts) {
        console.log(`  - ${c.name.S} = ${c.value?.N}`);
    }
    if (execute && counterPuts.length > 0) {
        batchWrite("AtomicNumber", counterPuts.map((Item) => ({ PutRequest: { Item } })));
        console.log(`AtomicNumber: ${counterPuts.length} 件を作成しました`);
    }

    // --- RentalBook: その場で書き換える。借りた人のメールアドレスは、画面表示用に renter_email へ残す
    const rentals = scan("RentalBook");
    const rentalUpdates = [];
    const rentalUnmapped = [];
    for (const rental of rentals) {
        const lender = rental.lender_username?.S;
        const renter = rental.renter_username?.S;
        const lenderSub = lender && emailToSub.get(lender.toLowerCase());
        const renterSub = renter && emailToSub.get(renter.toLowerCase());
        if (!lenderSub && !(lender && subs.has(lender))) {
            rentalUnmapped.push(`rental_id=${rental.rental_id.N} lender=${lender}`);
        }
        if (renter && !renterSub && !subs.has(renter)) {
            rentalUnmapped.push(`rental_id=${rental.rental_id.N} renter=${renter}`);
        }
        const sets = [];
        const values = {};
        if (lenderSub) {
            sets.push("lender_username = :ls", "legacy_lender_username = :ll");
            values[":ls"] = { S: lenderSub };
            values[":ll"] = { S: lender };
        }
        if (renterSub) {
            sets.push("renter_username = :rs", "legacy_renter_username = :rl", "renter_email = :re");
            values[":rs"] = { S: renterSub };
            values[":rl"] = { S: renter };
            values[":re"] = { S: renter };
        } else if (renter?.includes("@") && !subs.has(renter)) {
            // 退会などで Cognito に居ない借り手は、キーの値は変えず、表示用のメールアドレスだけ揃える
            sets.push("renter_email = :re");
            values[":re"] = { S: renter };
        }
        if (sets.length > 0) {
            rentalUpdates.push({ rentalId: rental.rental_id.N, expression: `SET ${sets.join(", ")}`, values });
        }
    }
    console.log(`RentalBook: 全 ${rentals.length} 件 / 書き換え対象 ${rentalUpdates.length} 件`);
    report("RentalBook: Cognito に存在しないユーザー（その値は変更しない）", rentalUnmapped);
    if (execute) {
        for (const u of rentalUpdates) {
            aws(
                "dynamodb", "update-item",
                "--table-name", "RentalBook",
                "--key", JSON.stringify({ rental_id: { N: u.rentalId } }),
                "--update-expression", u.expression,
                "--expression-attribute-values", JSON.stringify(u.values),
            );
        }
        console.log(`RentalBook: ${rentalUpdates.length} 件を書き換えました`);
    }
}

if (phase === "cleanup") {
    // 新キーの同じ行があるものだけを消す。copy が終わっていない行を消してしまわないため
    const oldRows = [];
    const noCopy = [];
    for (const item of books) {
        const sub = emailToSub.get(item.username.S.toLowerCase());
        if (!sub) {
            continue;
        }
        if (booksByKey.has(bookKey({ ...item, username: { S: sub } }))) {
            oldRows.push(item);
        } else {
            noCopy.push(bookKey(item));
        }
    }
    console.log(`Books: 削除対象（旧キー）${oldRows.length} 件`);
    report("Books: 新キーの行が無いため削除しない", noCopy);
    if (execute && oldRows.length > 0) {
        batchWrite("Books", oldRows.map((item) => ({ DeleteRequest: { Key: { username: item.username, seqno: item.seqno } } })));
        console.log(`Books: ${oldRows.length} 件を削除しました`);
    }

    const counters = scan("AtomicNumber");
    const names = new Set(counters.map((c) => c.name.S));
    const oldCounters = counters.filter((c) => {
        const match = /^Books-(.+)$/.exec(c.name.S);
        const sub = match && emailToSub.get(match[1].toLowerCase());
        return sub && names.has(`Books-${sub}`);
    });
    console.log(`AtomicNumber: 削除対象（旧キー）${oldCounters.length} 件`);
    if (execute && oldCounters.length > 0) {
        batchWrite("AtomicNumber", oldCounters.map((c) => ({ DeleteRequest: { Key: { name: c.name } } })));
        console.log(`AtomicNumber: ${oldCounters.length} 件を削除しました`);
    }
}

if (!execute) {
    console.log("\ndry-run のため、何も書き込んでいません。実行するには --execute を付けてください。");
}
