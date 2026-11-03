import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";

// ハンドラーがイベントやレスポンス全体を console.log するため、テスト結果が埋もれないよう抑える
before(() => mock.method(console, "log", () => {}));
after(() => mock.restoreAll());

/** 呼び出された URL を記録し、あらかじめ用意した本文を返す HTTP クライアント */
const createHttpGet = (data) => {
    const urls = [];
    return {
        urls,
        httpGet: async (url) => {
            urls.push(url);
            return { data };
        },
    };
};

const createEvent = (body) => ({ body: JSON.stringify(body) });

const parse = (response) => JSON.parse(response.body);

/** openBD の書誌情報。カナの読み（collationkey）の部分だけを持つ */
const openBdItem = (collationkey) => ({
    summary: { isbn: "9784048704694" },
    onix: {
        DescriptiveDetail: {
            TitleDetail: { TitleElement: { TitleText: { content: "タイトル", collationkey } } },
        },
    },
});

const kanaOf = (response) => parse(response).onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.collationkey;

test("ISBN で openBD を検索し、結果が 1 件ならその書誌情報を返す", async () => {
    const { urls, httpGet } = createHttpGet([openBdItem("アイウ")]);
    const handler = createHandler({ httpGet });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(urls, ["https://api.openbd.jp/v1/get?isbn=9784048704694"]);
    assert.equal(parse(res).summary.isbn, "9784048704694");
});

test("カナの読みから、半角スペースと全角スペースをすべて取り除く", async () => {
    const { httpGet } = createHttpGet([openBdItem("ワガハイ　ハ ネコ デ　アル")]);
    const handler = createHandler({ httpGet });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(kanaOf(res), "ワガハイハネコデアル");
});

test("カナの読みが無い書誌情報も、そのまま返す", async () => {
    const { httpGet } = createHttpGet([{ summary: { isbn: "9784048704694" }, onix: {} }]);
    const handler = createHandler({ httpGet });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { summary: { isbn: "9784048704694" }, onix: {} });
});

test("結果が 1 件でなければ 500 を返す", async () => {
    for (const data of [[], [openBdItem("ア"), openBdItem("イ")]]) {
        const { httpGet } = createHttpGet(data);
        const handler = createHandler({ httpGet });

        const res = await handler(createEvent({ isbnjan: "9784048704694" }));

        assert.equal(res.statusCode, 500, `${data.length} 件`);
        assert.deepEqual(parse(res), { message: "検索結果が1件ではありませんでした。" });
    }
});

test("openBD の呼び出しが失敗したら 500 を返す", async () => {
    const handler = createHandler({ httpGet: async () => { throw new Error("network down"); } });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.statusCode, 500);
});

test("レスポンスに CORS ヘッダーが付く", async () => {
    const { httpGet } = createHttpGet([openBdItem("ア")]);
    const handler = createHandler({ httpGet });

    const res = await handler(createEvent({ isbnjan: "9784048704694" }));

    assert.equal(res.headers["Access-Control-Allow-Origin"], "*");
});
