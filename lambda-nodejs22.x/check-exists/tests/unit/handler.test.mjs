import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/**
 * query の呼び出しを記録し、あらかじめ用意した結果を順に返す保存先。
 * ハンドラーは同じ入力オブジェクトを書き換えながら使い回すため、記録時に複製する
 */
const createStore = (...results) => {
    const queries = [];
    return {
        queries,
        query: async (input) => {
            queries.push(structuredClone(input));
            return results[queries.length - 1];
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (claims, body) => ({
    body: JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

test("ISBN の本を持っていれば true を返す", async () => {
    const store = createStore({ Items: [{ seqno: 1 }] });
    const handler = createHandler({ store });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { result: true });
    assert.equal(store.queries.length, 1);
});

test("認証済みのユーザー自身の本だけを、isbn-index で検索する", async () => {
    const store = createStore({ Items: [] });
    const handler = createHandler({ store });

    await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    const [query] = store.queries;
    assert.equal(query.TableName, "Books");
    assert.equal(query.IndexName, "isbn-index");
    assert.deepEqual(query.ExpressionAttributeValues, { ":un": "a@example.com", ":isbn": "9784048704694" });
    assert.equal(query.ConsistentRead, true);
});

test("本文にユーザー名を入れても、認証済みのユーザーとして検索される", async () => {
    const store = createStore({ Items: [] });
    const handler = createHandler({ store });

    await handler(createEvent({ email: "attacker@example.com" }, { isbn: "9784048704694", userName: "owner@example.com", username: "owner@example.com" }));

    assert.equal(store.queries[0].ExpressionAttributeValues[":un"], "attacker@example.com");
});

test("最初のページに無くても、次のページに有れば true を返す", async () => {
    const lastKey = { username: "a@example.com", seqno: 5 };
    const store = createStore(
        { Items: [], LastEvaluatedKey: lastKey },
        { Items: [{ seqno: 9 }] },
    );
    const handler = createHandler({ store });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.deepEqual(parse(res), { result: true });
    assert.equal(store.queries.length, 2);
    assert.equal(store.queries[0].ExclusiveStartKey, undefined);
    assert.deepEqual(store.queries[1].ExclusiveStartKey, lastKey);
});

test("最後のページまで見て無ければ false を返す", async () => {
    const store = createStore(
        { Items: [], LastEvaluatedKey: { seqno: 5 } },
        { Items: [] },
    );
    const handler = createHandler({ store });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { result: false });
    assert.equal(store.queries.length, 2);
});

test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore({ Items: [] });
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

test("レスポンスに CORS ヘッダーが付く", async () => {
    const handler = createHandler({ store: createStore({ Items: [] }) });

    const res = await handler(createEvent({ email: "a@example.com" }, { isbn: "9784048704694" }));

    assert.equal(res.headers["Access-Control-Allow-Origin"], "*");
});
