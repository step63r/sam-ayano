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

test("認証済みのユーザーの冊数を、COUNT で数える", async () => {
    const store = createStore({ Count: 12 });
    const handler = createHandler({ store });

    const res = await handler(createEvent({ email: "a@example.com" }, {}));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { count: 12 });
    const [query] = store.queries;
    assert.equal(query.TableName, "Books");
    assert.equal(query.Select, "COUNT");
    assert.equal(query.ConsistentRead, true);
    assert.deepEqual(query.ExpressionAttributeValues, { ":un": "a@example.com" });
});

test("複数ページにまたがる場合は、全ページの件数を合計する", async () => {
    const store = createStore(
        { Count: 100, LastEvaluatedKey: { seqno: 100 } },
        { Count: 100, LastEvaluatedKey: { seqno: 200 } },
        { Count: 5 },
    );
    const handler = createHandler({ store });

    const res = await handler(createEvent({ email: "a@example.com" }, {}));

    assert.deepEqual(parse(res), { count: 205 });
    assert.equal(store.queries.length, 3);
    assert.equal(store.queries[0].ExclusiveStartKey, undefined);
    assert.deepEqual(store.queries[1].ExclusiveStartKey, { seqno: 100 });
    assert.deepEqual(store.queries[2].ExclusiveStartKey, { seqno: 200 });
});

test("1 冊も無ければ 0 を返す", async () => {
    const handler = createHandler({ store: createStore({ Count: 0 }) });

    const res = await handler(createEvent({ email: "a@example.com" }, {}));

    assert.deepEqual(parse(res), { count: 0 });
});

test("Count が無い結果は 0 件として扱う", async () => {
    const handler = createHandler({ store: createStore({}) });

    const res = await handler(createEvent({ email: "a@example.com" }, {}));

    assert.deepEqual(parse(res), { count: 0 });
});

test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore({ Count: 1 });
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { email: "" }, { email: 123 }]) {
        const res = await handler(createEvent(claims, {}));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.queries.length, 0);
});

test("DynamoDB が失敗したら 500 を返す", async () => {
    const handler = createHandler({ store: { query: async () => { throw new Error("boom"); } } });

    const res = await handler(createEvent({ email: "a@example.com" }, {}));

    assert.equal(res.statusCode, 500);
});
