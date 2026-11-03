import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベント全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/**
 * query の呼び出しを記録し、あらかじめ用意したページを順に返す保存先。
 * ハンドラーは同じ入力オブジェクトを書き換えながら使い回すため、記録時に複製する
 */
const createStore = (...pages) => {
    const queries = [];
    return {
        queries,
        query: async (input) => {
            queries.push(structuredClone(input));
            return pages[queries.length - 1];
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (claims, body) => ({
    body: JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

const USER = { email: "a@example.com" };
const book = (seqno, extra = {}) => ({ seqno, title: `本${seqno}`, ...extra });

test("認証済みのユーザーの本を、ページサイズの件数で、一貫性のある読み取りで検索する", async () => {
    const store = createStore({ Items: [book(1), book(2)] });
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { pageSize: 2 }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res).items, [book(1), book(2)]);
    const [query] = store.queries;
    assert.equal(query.TableName, "Books");
    assert.equal(query.IndexName, undefined);
    assert.equal(query.KeyConditionExpression, "#un = :un");
    assert.deepEqual(query.ExpressionAttributeValues, { ":un": "a@example.com" });
    assert.equal(query.Limit, 2);
    assert.equal(query.ConsistentRead, true);
});

test("本文に他人のユーザー名を入れても、認証済みのユーザーの本として検索される", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    await handler(createEvent({ email: "attacker@example.com" }, { pageSize: 1, userName: "owner@example.com", username: "owner@example.com" }));

    assert.equal(store.queries[0].ExpressionAttributeValues[":un"], "attacker@example.com");
});

test("ISBN を指定すると、isbn-index でその ISBN の本に絞る", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    await handler(createEvent(USER, { pageSize: 1, isbn: "9784048704694" }));

    const [query] = store.queries;
    assert.equal(query.IndexName, "isbn-index");
    assert.equal(query.KeyConditionExpression, "#un = :un and #isbn = :isbn");
    assert.equal(query.ExpressionAttributeValues[":isbn"], "9784048704694");
});

test("sortKeyId で、並び替えに使うインデックスを切り替える", async () => {
    const cases = [
        [1, "title-index"],
        [2, "titleKana-index"],
        [3, "salesDate-index"],
    ];

    for (const [sortKeyId, indexName] of cases) {
        const store = createStore({ Items: [book(1)] });
        const handler = createHandler({ store });

        await handler(createEvent(USER, { pageSize: 1, sortKeyId }));

        assert.equal(store.queries[0].IndexName, indexName, `sortKeyId=${sortKeyId}`);
    }
});

test("知らない sortKeyId は、インデックスを指定しない", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    await handler(createEvent(USER, { pageSize: 1, sortKeyId: 99 }));

    assert.equal(store.queries[0].IndexName, undefined);
});

test("desc を指定すると降順で検索し、指定しなければ ScanIndexForward を指定しない", async () => {
    const descStore = createStore({ Items: [book(1)] });
    await createHandler({ store: descStore })(createEvent(USER, { pageSize: 1, desc: true }));
    const ascStore = createStore({ Items: [book(1)] });
    await createHandler({ store: ascStore })(createEvent(USER, { pageSize: 1 }));

    assert.equal(descStore.queries[0].ScanIndexForward, false);
    assert.equal(ascStore.queries[0].ScanIndexForward, undefined);
});

test("キーワードは、著者・出版社・タイトルの部分一致で絞る", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    await handler(createEvent(USER, { pageSize: 1, keyword: "夏目" }));

    const [query] = store.queries;
    assert.equal(query.FilterExpression, "(contains(#author, :keyword) or contains(#publisherName, :keyword) or contains(#title, :keyword))");
    assert.equal(query.ExpressionAttributeValues[":keyword"], "夏目");
    assert.deepEqual(
        [query.ExpressionAttributeNames["#author"], query.ExpressionAttributeNames["#publisherName"], query.ExpressionAttributeNames["#title"]],
        ["author", "publisherName", "title"],
    );
});

test("未読だけを指定すると、readFlag が false の本に絞る", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    await handler(createEvent(USER, { pageSize: 1, unreadFlag: true }));

    const [query] = store.queries;
    assert.equal(query.FilterExpression, "#readFlag = :readFlag");
    assert.equal(query.ExpressionAttributeNames["#readFlag"], "readFlag");
    assert.equal(query.ExpressionAttributeValues[":readFlag"], false);
});

test("キーワードと未読を両方指定すると、キーワードのどれかに一致し、かつ未読の本に絞る", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    await handler(createEvent(USER, { pageSize: 1, keyword: "夏目", unreadFlag: true }));

    // DynamoDB は and を or より先に評価する。キーワードの or 全体が括弧で囲まれていないと、
    // 「著者 or 出版社 or (タイトル and 未読)」になり、既読の本も混ざってしまう
    const [query] = store.queries;
    assert.equal(
        query.FilterExpression,
        "(contains(#author, :keyword) or contains(#publisherName, :keyword) or contains(#title, :keyword)) and #readFlag = :readFlag",
    );
});

test("フィルターで件数が足りないときは、ページサイズに達するまで次のページを読む", async () => {
    const lastKey1 = { username: "a@example.com", seqno: 10 };
    const lastKey2 = { username: "a@example.com", seqno: 20 };
    const store = createStore(
        { Items: [book(1)], LastEvaluatedKey: lastKey1 },
        { Items: [book(2)], LastEvaluatedKey: lastKey2 },
        { Items: [book(3)] },
    );
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { pageSize: 3, keyword: "本" }));

    assert.equal(store.queries.length, 3);
    assert.equal(store.queries[0].ExclusiveStartKey, undefined);
    assert.deepEqual(store.queries[1].ExclusiveStartKey, lastKey1);
    assert.deepEqual(store.queries[2].ExclusiveStartKey, lastKey2);
    assert.deepEqual(parse(res).items.map((i) => i.seqno), [1, 2, 3]);
    assert.equal(parse(res).lastEvaluatedKey, undefined);
});

test("クライアントから受け取った lastEvaluatedKey から読み始め、続きが有れば次の lastEvaluatedKey を返す", async () => {
    const clientKey = { username: "a@example.com", seqno: 5 };
    const nextKey = { username: "a@example.com", seqno: 7 };
    const store = createStore({ Items: [book(6), book(7)], LastEvaluatedKey: nextKey });
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { pageSize: 2, lastEvaluatedKey: clientKey }));

    assert.deepEqual(store.queries[0].ExclusiveStartKey, clientKey);
    assert.deepEqual(parse(res).lastEvaluatedKey, nextKey);
});

test("ページサイズより多く読んだら切り詰め、最後の本から lastEvaluatedKey を作り直す", async () => {
    const store = createStore({
        Items: [book(1), book(2), book(3)],
        LastEvaluatedKey: { username: "a@example.com", seqno: 3 },
    });
    const handler = createHandler({ store });

    const res = await handler(createEvent(USER, { pageSize: 2 }));

    assert.deepEqual(parse(res).items.map((i) => i.seqno), [1, 2]);
    assert.deepEqual(parse(res).lastEvaluatedKey, { username: "a@example.com", seqno: 2 });
});

test("並び替えのインデックスを使っているときは、lastEvaluatedKey にそのソートキーも入る", async () => {
    const cases = [
        [1, "title", { title: "あ" }],
        [2, "titleKana", { titleKana: "アイ" }],
        [3, "salesDate", { salesDate: "2020年01月" }],
    ];

    for (const [sortKeyId, keyName, sortValue] of cases) {
        const store = createStore({
            Items: [book(1), book(2, sortValue), book(3)],
            LastEvaluatedKey: { username: "a@example.com", seqno: 3 },
        });
        const handler = createHandler({ store });

        const res = await handler(createEvent(USER, { pageSize: 2, sortKeyId }));

        assert.deepEqual(
            parse(res).lastEvaluatedKey,
            { username: "a@example.com", seqno: 2, [keyName]: sortValue[keyName] },
            `sortKeyId=${sortKeyId}`,
        );
    }
});

test("認証情報が無ければ 401 を返し、DynamoDB を呼ばない", async () => {
    const store = createStore({ Items: [book(1)] });
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { email: "" }, { email: 123 }]) {
        const res = await handler(createEvent(claims, { pageSize: 1 }));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.queries.length, 0);
});

test("DynamoDB が失敗したら 500 を返す", async () => {
    const handler = createHandler({ store: { query: async () => { throw new Error("boom"); } } });

    const res = await handler(createEvent(USER, { pageSize: 1 }));

    assert.equal(res.statusCode, 500);
});
