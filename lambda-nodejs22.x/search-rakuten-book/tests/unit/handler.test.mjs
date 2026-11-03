import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";
import { SEARCH_URL } from "../../rakuten.mjs";

// 失敗時のログ出力で、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

const ENV = { RAKUTEN_APPLICATION_ID: "APP-ID", RAKUTEN_ACCESS_KEY: "pk_SECRET_KEY" };

/** 呼び出しを記録し、あらかじめ用意した結果を返す（Error なら投げる）HTTP クライアント */
const createHttpGet = (result) => {
    const calls = [];
    return {
        calls,
        httpGet: async (url, config) => {
            calls.push({ url, config });
            if (result instanceof Error) {
                throw result;
            }
            return { data: result };
        },
    };
};

const createEvent = (body) => ({ body: JSON.stringify(body) });

const parse = (response) => JSON.parse(response.body);

const BOOK = { title: "吾輩は猫である", isbn: "9784048704694" };

test("ISBN で楽天ブックスを検索し、ちょうど 1 件なら { Item } の形で返す", async () => {
    const { calls, httpGet } = createHttpGet({ Items: [{ Item: BOOK }] });
    const handler = createHandler({ httpGet, env: ENV });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { Item: BOOK });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, SEARCH_URL);
    assert.deepEqual(calls[0].config.params, {
        format: "json",
        isbnjan: "9784048704694",
        applicationId: "APP-ID",
        accessKey: "pk_SECRET_KEY",
    });
});

test("ハイフン付きの ISBN は、ハイフンを除いて検索する", async () => {
    const { calls, httpGet } = createHttpGet({ Items: [{ Item: BOOK }] });
    const handler = createHandler({ httpGet, env: ENV });

    await handler(createEvent({ isbnjan: "978-4-04-870469-4" }));

    assert.equal(calls[0].config.params.isbnjan, "9784048704694");
});

test("楽天の応答を待つ時間に上限を付ける", async () => {
    const { calls, httpGet } = createHttpGet({ Items: [{ Item: BOOK }] });
    const handler = createHandler({ httpGet, env: ENV });

    await handler(createEvent({ isbnjan: "9784048704694" }));

    // Lambda のタイムアウト(3秒)より短くしておかないと、原因の分かるエラーを返せない
    assert.ok(calls[0].config.timeout > 0 && calls[0].config.timeout < 3000);
});

test("RAKUTEN_REFERER があれば、Referer と Origin を付けて送る", async () => {
    const { calls, httpGet } = createHttpGet({ Items: [{ Item: BOOK }] });
    const handler = createHandler({ httpGet, env: { ...ENV, RAKUTEN_REFERER: "example.com" } });

    await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.deepEqual(calls[0].config.headers, { Referer: "https://example.com/", Origin: "https://example.com" });
});

test("ISBN/JAN の形式が正しくなければ 400 を返し、楽天を呼ばない", async () => {
    const { calls, httpGet } = createHttpGet({ Items: [{ Item: BOOK }] });
    const handler = createHandler({ httpGet, env: ENV });

    for (const isbnjan of ["9784048704694&applicationId=evil", "abc", "", "1234567", undefined, 9784048704694]) {
        const res = await handler(createEvent({ isbnjan }));
        assert.equal(res.statusCode, 400, String(isbnjan));
    }
    assert.equal(calls.length, 0);
});

test("本文が無い、または JSON でないときも 400 を返す", async () => {
    const handler = createHandler({ httpGet: createHttpGet({}).httpGet, env: ENV });

    assert.equal((await handler({ body: null })).statusCode, 400);
    assert.equal((await handler({ body: "not json" })).statusCode, 400);
});

test("楽天の認証情報が設定されていなければ 500 を返し、楽天を呼ばない", async () => {
    for (const env of [{}, { RAKUTEN_APPLICATION_ID: "APP-ID" }, { RAKUTEN_ACCESS_KEY: "pk_SECRET_KEY" }, { ...ENV, RAKUTEN_ACCESS_KEY: "" }]) {
        const { calls, httpGet } = createHttpGet({ Items: [{ Item: BOOK }] });
        const handler = createHandler({ httpGet, env });

        const res = await handler(createEvent({ isbnjan: "9784048704694" }));

        assert.equal(res.statusCode, 500, JSON.stringify(env));
        assert.equal(calls.length, 0);
    }
});

test("検索結果が 1 件でなければ 500 を返す", async () => {
    for (const data of [{ Items: [] }, { Items: [{ Item: BOOK }, { Item: BOOK }] }, {}]) {
        const { httpGet } = createHttpGet(data);
        const handler = createHandler({ httpGet, env: ENV });

        const res = await handler(createEvent({ isbnjan: "9784048704694" }));

        assert.equal(res.statusCode, 500, JSON.stringify(data));
        assert.deepEqual(parse(res), { message: "検索結果が1件ではありませんでした。" });
    }
});

test("楽天の呼び出しが失敗したら 502 を返し、認証情報を含む値はレスポンスに載せない", async () => {
    const error = Object.assign(new Error("Request failed with status code 403"), {
        code: "ERR_BAD_REQUEST",
        // axios のエラーは、認証情報を含む URL とヘッダーを持つ
        config: { url: `${SEARCH_URL}?applicationId=APP-ID&accessKey=pk_SECRET_KEY`, params: { accessKey: "pk_SECRET_KEY" } },
        response: { status: 403, data: { errors: { errorMessage: "REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING" } } },
    });
    const { httpGet } = createHttpGet(error);
    const handler = createHandler({ httpGet, env: { ...ENV, RAKUTEN_REFERER: "example.com" } });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.statusCode, 502);
    assert.deepEqual(parse(res), {
        message: "楽天ブックスAPIの呼び出しに失敗しました。",
        upstreamStatus: 403,
        code: "ERR_BAD_REQUEST",
        detail: "REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING",
        sentReferer: "https://example.com/",
        sentOrigin: "https://example.com",
    });
    assert.equal(res.body.includes("pk_SECRET_KEY"), false);
    assert.equal(res.body.includes("APP-ID"), false);
});

test("Referer を設定していないときの失敗では、送った Referer と Origin は null で返す", async () => {
    const { httpGet } = createHttpGet(new Error("timeout of 2500ms exceeded"));
    const handler = createHandler({ httpGet, env: ENV });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.statusCode, 502);
    assert.equal(parse(res).sentReferer, null);
    assert.equal(parse(res).sentOrigin, null);
});
