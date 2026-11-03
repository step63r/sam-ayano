import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/** delete の呼び出しを記録する保存先 */
const createStore = () => {
    const deletes = [];
    return {
        deletes,
        delete: async (input) => {
            deletes.push(input);
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

test("認証済みのユーザーの本を削除する", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { result: true });
    assert.deepEqual(store.deletes, [{ TableName: "Books", Key: { username: "a@example.com", seqno: 3 } }]);
});

test("本文に他人のユーザー名を入れても、認証済みのユーザーの本として削除される", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "attacker@example.com" }, { seqno: 3, userName: "owner@example.com", username: "owner@example.com" }));

    assert.equal(store.deletes.length, 1);
    assert.equal(store.deletes[0].Key.username, "attacker@example.com");
});

test("認証情報が無ければ 401 を返し、何も削除しない", async () => {
    const store = createStore();
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { sub: "" }, { sub: 123 }]) {
        const res = await handler(createEvent(claims, { seqno: 3 }));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.deletes.length, 0);
});

test("DynamoDB が失敗したら 500 を返す", async () => {
    const handler = createHandler({ store: { delete: async () => { throw new Error("boom"); } } });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    assert.equal(res.statusCode, 500);
});
