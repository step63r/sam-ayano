import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/**
 * 呼び出しを順番に記録する保存先。AtomicNumber の更新には、採番した値を返す
 * @param {object} [options]
 * @param {number} [options.nextSeq] 採番して返すシーケンス番号
 */
const createStore = ({ nextSeq = 4 } = {}) => {
    const calls = [];
    return {
        calls,
        update: async (input) => {
            calls.push({ op: "update", input });
            return input.TableName === "AtomicNumber" ? { Attributes: { value: nextSeq } } : {};
        },
        put: async (input) => {
            calls.push({ op: "put", input });
            return {};
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (claims, body) => ({
    body: JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

const USER = { sub: "a@example.com" };

const newBook = {
    author: "夏目漱石",
    isbn: "9784048704694",
    publisherName: "出版社",
    salesDate: "2020年01月",
    title: "吾輩は猫である",
    titleKana: "ワガハイハネコデアル",
};

// ---- 新規登録 ----
test("新規登録は、ユーザーごとのシーケンス番号を採番し、その番号で本を登録する", async () => {
    const store = createStore({ nextSeq: 4 });
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { data: newBook }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { message: "OK" });
    assert.deepEqual(store.calls.map((c) => `${c.op}:${c.input.TableName}`), ["update:AtomicNumber", "put:Books"]);
    assert.deepEqual(store.calls[0].input.Key, { name: "Books-a@example.com" });
    assert.deepEqual(store.calls[1].input, {
        TableName: "Books",
        Item: {
            username: "a@example.com",
            seqno: 4,
            ...newBook,
            readFlag: false,
            note: "",
        },
    });
});

test("新規登録で、読了フラグとメモを指定すれば、その値で登録する", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent(USER, { data: { ...newBook, readFlag: true, note: "面白かった" } }));

    const item = store.calls.find((c) => c.op === "put").input.Item;
    assert.equal(item.readFlag, true);
    assert.equal(item.note, "面白かった");
});

test("新規登録で、https の書影 URL は保存する", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent(USER, { data: { ...newBook, coverUrl: "https://cover.openbd.jp/9784048704694.jpg" } }));

    assert.equal(store.calls.find((c) => c.op === "put").input.Item.coverUrl, "https://cover.openbd.jp/9784048704694.jpg");
});

test("新規登録で、検証を通らない書影 URL は保存せず、登録自体は成功する", async () => {
    for (const coverUrl of ["http://example.com/a.jpg", "javascript:alert(1)", "", 123]) {
        const store = createStore();
        const handler = createHandler({ store });

        const res = await handler(createEvent(USER, { data: { ...newBook, coverUrl } }));

        assert.equal(res.statusCode, 200, String(coverUrl));
        assert.equal("coverUrl" in store.calls.find((c) => c.op === "put").input.Item, false, String(coverUrl));
    }
});

test("新規登録は、本文に他人のユーザー名を入れても、認証済みのユーザーの本として登録される", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "attacker@example.com" }, { data: { ...newBook, username: "owner@example.com" }, userName: "owner@example.com" }));

    assert.equal(store.calls.find((c) => c.op === "put").input.Item.username, "attacker@example.com");
    assert.deepEqual(store.calls[0].input.Key, { name: "Books-attacker@example.com" });
});

// ---- 更新 ----
const existing = { ...newBook, seqno: 3, readFlag: true, note: "メモ" };

test("更新は、存在する本だけを、書影以外の項目で上書きする", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { data: existing }));

    assert.equal(res.statusCode, 200);
    assert.equal(store.calls.length, 1);
    const update = store.calls[0].input;
    assert.equal(update.TableName, "Books");
    assert.deepEqual(update.Key, { username: "a@example.com", seqno: 3 });
    // 存在しない本の行を、不完全な項目として作ってしまわないための条件
    assert.equal(update.ConditionExpression, "attribute_exists(seqno)");
    assert.deepEqual(update.ExpressionAttributeValues, {
        ":at": "夏目漱石",
        ":pn": "出版社",
        ":sd": "2020年01月",
        ":t": "吾輩は猫である",
        ":tk": "ワガハイハネコデアル",
        ":rf": true,
        ":note": "メモ",
    });
    assert.equal(update.UpdateExpression.includes("coverUrl"), false);
});

test("更新で、読了フラグとメモを指定しなければ、false と空文字で更新する", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent(USER, { data: { ...newBook, seqno: 3 } }));

    const values = store.calls[0].input.ExpressionAttributeValues;
    assert.equal(values[":rf"], false);
    assert.equal(values[":note"], "");
});

test("更新は、採番も新規登録もしない", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent(USER, { data: existing }));

    assert.equal(store.calls.some((c) => c.op === "put"), false);
    assert.equal(store.calls.some((c) => c.input.TableName === "AtomicNumber"), false);
});

test("更新は、本文に他人のユーザー名を入れても、認証済みのユーザーの本として更新される", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "attacker@example.com" }, { data: { ...existing, username: "owner@example.com" }, userName: "owner@example.com" }));

    assert.deepEqual(store.calls[0].input.Key, { username: "attacker@example.com", seqno: 3 });
});

test("存在しない本の更新で、条件に合わず DynamoDB が失敗したら 500 を返す", async () => {
    const store = createStore();
    store.update = async () => {
        const error = new Error("The conditional request failed");
        error.name = "ConditionalCheckFailedException";
        throw error;
    };
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { data: existing }));

    assert.equal(res.statusCode, 500);
});

// ---- 書影だけの更新 ----
test("書影だけの更新は、書影以外の項目に触れない", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { data: { seqno: 3, coverOnly: true, coverUrl: "https://example.com/a.jpg", title: "書き換えたいタイトル" } }));

    assert.equal(res.statusCode, 200);
    assert.equal(store.calls.length, 1);
    const update = store.calls[0].input;
    assert.deepEqual(update.Key, { username: "a@example.com", seqno: 3 });
    assert.equal(update.UpdateExpression, "set #cu = :cu");
    assert.deepEqual(update.ExpressionAttributeValues, { ":cu": "https://example.com/a.jpg" });
    assert.equal(update.ConditionExpression, "attribute_exists(seqno)");
});

test("書影だけの更新で、URL が正しくなければ 400 を返し、何も更新しない", async () => {
    for (const coverUrl of ["http://example.com/a.jpg", "javascript:alert(1)", "", undefined]) {
        const store = createStore();
        const handler = createHandler({ store });

        const res = await handler(createEvent(USER, { data: { seqno: 3, coverOnly: true, coverUrl } }));

        assert.equal(res.statusCode, 400, String(coverUrl));
        assert.deepEqual(parse(res), { message: "書影のURLが正しくありません。" });
        assert.equal(store.calls.length, 0, String(coverUrl));
    }
});

test("書影だけの更新は、本文に他人のユーザー名を入れても、認証済みのユーザーの本が対象になる", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "attacker@example.com" }, { data: { seqno: 3, coverOnly: true, coverUrl: "https://example.com/a.jpg", username: "owner@example.com" } }));

    assert.equal(store.calls[0].input.Key.username, "attacker@example.com");
});

test("coverOnly が付いていても、seqno が無ければ新規登録として扱う", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent(USER, { data: { ...newBook, coverOnly: true } }));

    assert.deepEqual(store.calls.map((c) => c.op), ["update", "put"]);
});

// ---- 共通 ----
test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { sub: "" }, { sub: 123 }]) {
        const res = await handler(createEvent(claims, { data: newBook }));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.calls.length, 0);
});

test("DynamoDB が失敗したら 500 を返す", async () => {
    const handler = createHandler({ store: { update: async () => { throw new Error("boom"); }, put: async () => {} } });

    const res = await handler(createEvent(USER, { data: newBook }));

    assert.equal(res.statusCode, 500);
});
