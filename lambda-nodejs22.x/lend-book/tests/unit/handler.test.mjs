import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/**
 * 呼び出しを順番に記録する保存先。AtomicNumber の更新には、採番した値を返す
 * @param {object} options
 * @param {object[]} [options.books] isbn-index の検索結果
 * @param {number} [options.nextSeq] 採番して返す貸出ID
 */
const createStore = ({ books = [], nextSeq = 7 } = {}) => {
    const calls = [];
    return {
        calls,
        query: async (input) => {
            calls.push({ op: "query", input });
            return { Items: books };
        },
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

const LENDER = { sub: "owner@example.com" };
const BODY = { renter_username: "friend@example.com", isbn: "9784048704694" };

test("貸出可能な本を貸し出すと、貸出記録を作り、本の貸出フラグを立てる", async () => {
    const store = createStore({ books: [{ seqno: 10, lendFlag: false }], nextSeq: 7 });
    const handler = createHandler({ store, now: () => 12345 });

    const res = await handler(createEvent(LENDER, BODY));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { message: "OK" });

    const put = store.calls.find((c) => c.op === "put").input;
    assert.deepEqual(put, {
        TableName: "RentalBook",
        Item: {
            rental_id: 7,
            lender_username: "owner@example.com",
            renter_username: "friend@example.com",
            isbn: "9784048704694",
            seqno: 10,
            rental_date: 12345,
            return_flag: false,
        },
    });

    const flagUpdate = store.calls.filter((c) => c.op === "update").map((c) => c.input).find((i) => i.TableName === "Books");
    assert.deepEqual(flagUpdate.Key, { username: "owner@example.com", seqno: 10 });
    assert.equal(flagUpdate.UpdateExpression, "set #lf = :true");
    assert.equal(flagUpdate.ExpressionAttributeNames["#lf"], "lendFlag");
    assert.equal(flagUpdate.ExpressionAttributeValues[":true"], true);
});

test("検索 → 採番 → 貸出記録の登録 → 貸出フラグの更新の順に処理する", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    const handler = createHandler({ store });

    await handler(createEvent(LENDER, BODY));

    assert.deepEqual(
        store.calls.map((c) => `${c.op}:${c.input.TableName}`),
        ["query:Books", "update:AtomicNumber", "put:RentalBook", "update:Books"],
    );
});

test("貸出IDは、AtomicNumber の RentalBook を 1 進めて採番する", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    const handler = createHandler({ store });

    await handler(createEvent(LENDER, BODY));

    const seq = store.calls.find((c) => c.input.TableName === "AtomicNumber").input;
    assert.deepEqual(seq.Key, { name: "RentalBook" });
    assert.equal(seq.ExpressionAttributeValues[":val"], 1);
});

test("貸出中の本はとばし、貸出中でない本を貸し出す。貸出フラグが無い本も貸し出せる", async () => {
    const store = createStore({ books: [{ seqno: 1, lendFlag: true }, { seqno: 2 }, { seqno: 3, lendFlag: false }] });
    const handler = createHandler({ store });

    await handler(createEvent(LENDER, BODY));

    assert.equal(store.calls.find((c) => c.op === "put").input.Item.seqno, 2);
});

test("貸出可能な本が無ければ 500 を返し、採番も貸出記録の登録もしない", async () => {
    const store = createStore({ books: [{ seqno: 1, lendFlag: true }] });
    const handler = createHandler({ store });

    const res = await handler(createEvent(LENDER, BODY));

    assert.equal(res.statusCode, 500);
    assert.deepEqual(parse(res), { message: "貸出可能な書籍が見つかりません。" });
    assert.deepEqual(store.calls.map((c) => c.op), ["query"]);
});

test("貸す側は認証済みのユーザーで、本文に別の貸出者を入れても使われない", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "attacker@example.com" }, { ...BODY, lender_username: "owner@example.com", userName: "owner@example.com" }));

    const query = store.calls.find((c) => c.op === "query").input;
    assert.equal(query.ExpressionAttributeValues[":un"], "attacker@example.com");
    assert.equal(store.calls.find((c) => c.op === "put").input.Item.lender_username, "attacker@example.com");
    assert.equal(store.calls.filter((c) => c.input.TableName === "Books" && c.op === "update")[0].input.Key.username, "attacker@example.com");
});

test("借りる側は、本文の値がそのまま貸出記録に入る", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    const handler = createHandler({ store });

    await handler(createEvent(LENDER, { ...BODY, renter_username: "someone@example.com" }));

    assert.equal(store.calls.find((c) => c.op === "put").input.Item.renter_username, "someone@example.com");
});

test("借りる側のメールアドレスが本文にあれば、表示用に貸出記録へ控える", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    const handler = createHandler({ store });

    await handler(createEvent(LENDER, { ...BODY, renter_email: "friend@example.com" }));

    assert.equal(store.calls.find((c) => c.op === "put").input.Item.renter_email, "friend@example.com");
});

test("借りる側のメールアドレスが空や文字列でなければ、貸出記録に含めない", async () => {
    for (const renter_email of ["", 123, null]) {
        const store = createStore({ books: [{ seqno: 10 }] });
        const handler = createHandler({ store });

        await handler(createEvent(LENDER, { ...BODY, renter_email }));

        assert.equal("renter_email" in store.calls.find((c) => c.op === "put").input.Item, false);
    }
});

test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { sub: "" }, { sub: 123 }]) {
        const res = await handler(createEvent(claims, BODY));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.calls.length, 0);
});

test("採番に失敗したら 500 を返し、貸出記録を登録しない", async () => {
    const store = createStore({ books: [{ seqno: 10 }] });
    store.update = async () => { throw new Error("boom"); };
    const handler = createHandler({ store });

    const res = await handler(createEvent(LENDER, BODY));

    assert.equal(res.statusCode, 500);
    assert.equal(store.calls.some((c) => c.op === "put"), false);
});
