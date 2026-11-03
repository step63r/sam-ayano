import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/** get / query の呼び出しを記録し、あらかじめ用意した結果を返す保存先 */
const createStore = ({ item, rentals = [] } = {}) => {
    const gets = [];
    const queries = [];
    return {
        gets,
        queries,
        get: async (input) => {
            gets.push(input);
            return { Item: item };
        },
        query: async (input) => {
            queries.push(input);
            return { Items: rentals };
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (claims, body) => ({
    body: JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

test("貸出中でない本は、本の情報だけを返し、貸出記録を検索しない", async () => {
    const store = createStore({ item: { username: "a@example.com", seqno: 3, title: "本", lendFlag: false } });
    const handler = createHandler({ store });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { items: { username: "a@example.com", seqno: 3, title: "本", lendFlag: false } });
    assert.deepEqual(store.gets, [{ TableName: "Books", Key: { username: "a@example.com", seqno: 3 } }]);
    assert.equal(store.queries.length, 0);
});

test("貸出中の本は、貸出記録から貸出ID・借りた人・貸出日を付けて返す", async () => {
    const store = createStore({
        item: { username: "a@example.com", seqno: 3, lendFlag: true },
        rentals: [{ rental_id: 7, renter_username: "friend-sub", renter_email: "friend@example.com", rental_date: 1700000000000 }],
    });
    const handler = createHandler({ store });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res).items, {
        username: "a@example.com",
        seqno: 3,
        lendFlag: true,
        rentalId: 7,
        renterUsername: "friend-sub",
        renterEmail: "friend@example.com",
        rentalDate: 1700000000000,
    });
});

test("貸出記録は、認証済みのユーザーが貸した、その本の分だけを検索する", async () => {
    const store = createStore({ item: { seqno: 3, lendFlag: true } });
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    const [query] = store.queries;
    assert.equal(query.TableName, "RentalBook");
    assert.equal(query.IndexName, "lender-seqno-index");
    assert.deepEqual(query.ExpressionAttributeValues, { ":lun": "a@example.com", ":seqno": 3 });
});

test("貸出中でも貸出記録が見つからなければ、借りた人は空、貸出日は 0 で返す", async () => {
    const store = createStore({ item: { seqno: 3, lendFlag: true }, rentals: [] });
    const handler = createHandler({ store });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    assert.equal(res.statusCode, 200);
    assert.equal(parse(res).items.renterUsername, "");
    assert.equal(parse(res).items.renterEmail, "");
    assert.equal(parse(res).items.rentalDate, 0);
    assert.equal("rentalId" in parse(res).items, false);
});

test("存在しない本は、空の items を 200 で返す", async () => {
    const handler = createHandler({ store: createStore({ item: undefined }) });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 999 }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { items: {} });
});

test("本文に他人のユーザー名を入れても、認証済みのユーザーの本として取得される", async () => {
    const store = createStore({ item: { seqno: 3 } });
    const handler = createHandler({ store });

    await handler(createEvent({ sub: "attacker@example.com" }, { seqno: 3, userName: "owner@example.com", username: "owner@example.com" }));

    assert.equal(store.gets[0].Key.username, "attacker@example.com");
});

test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore({ item: { seqno: 3 } });
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { sub: "" }, { sub: 123 }]) {
        const res = await handler(createEvent(claims, { seqno: 3 }));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.gets.length, 0);
    assert.equal(store.queries.length, 0);
});

test("DynamoDB が失敗したら 500 を返す", async () => {
    const handler = createHandler({ store: { get: async () => { throw new Error("boom"); } } });

    const res = await handler(createEvent({ sub: "a@example.com" }, { seqno: 3 }));

    assert.equal(res.statusCode, 500);
});
