import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/** query の呼び出しを記録し、あらかじめ用意した結果を返す保存先 */
const createStore = ({ items = [] } = {}) => {
    const queries = [];
    return {
        queries,
        query: async (input) => {
            queries.push(structuredClone(input));
            return { Items: items };
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (claims, body) => ({
    body: JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

const AVAILABLE = { seqno: 1, title: "貸出中でない本", lendFlag: false };
const NO_FLAG = { seqno: 2, title: "貸出フラグが無い本" };
const LENT = { seqno: 3, title: "貸出中の本", lendFlag: true };

test("貸出中でない最初の本を返す。貸出フラグが無い本も貸出可能として扱う", async () => {
    const handler = createHandler({ store: createStore({ items: [LENT, NO_FLAG, AVAILABLE] }) });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { item: NO_FLAG });
});

test("すべて貸出中なら、貸出可能な本が無いとして 500 を返す", async () => {
    const handler = createHandler({ store: createStore({ items: [LENT] }) });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.statusCode, 500);
    assert.deepEqual(parse(res), { message: "貸出可能な書籍が見つかりません。" });
});

test("その ISBN の本が 1 冊も無い場合も、貸出可能な本が無いとして 500 を返す", async () => {
    const handler = createHandler({ store: createStore({ items: [] }) });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.statusCode, 500);
});

test("認証済みのユーザー自身の本だけを、isbn-index で検索する", async () => {
    const store = createStore({ items: [AVAILABLE] });
    const handler = createHandler({ store });

    await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    const [query] = store.queries;
    assert.equal(query.TableName, "Books");
    assert.equal(query.IndexName, "isbn-index");
    assert.deepEqual(query.ExpressionAttributeValues, { ":un": "a@example.com", ":isbn": "9784048704694" });
    assert.equal(query.ConsistentRead, true);
});

test("本文に他人のユーザー名を入れても、認証済みのユーザーの本として検索される", async () => {
    const store = createStore({ items: [AVAILABLE] });
    const handler = createHandler({ store });

    await handler(createEvent({ email: "attacker@example.com" }, { isbn: "9784048704694", userName: "owner@example.com", username: "owner@example.com" }));

    assert.equal(store.queries[0].ExpressionAttributeValues[":un"], "attacker@example.com");
});

test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore({ items: [AVAILABLE] });
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { email: "" }, { email: 123 }]) {
        const res = await handler(createEvent(claims, { isbn: "9784048704694" }));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.queries.length, 0);
});

test("DynamoDB が失敗したら 500 を返す", async () => {
    const handler = createHandler({ store: { query: async () => { throw new Error("boom"); } } });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.statusCode, 500);
});
