// 実行: node --test search-rakuten-book/tests/unit/rakuten.test.mjs
// （この Lambda の package.json の test は mocha の雛形のままのため、node:test で単体で実行する）
import { test } from "node:test";
import assert from "node:assert/strict";
import { SEARCH_URL, buildRequest, describeUpstreamError, normalizeIsbnJan, normalizeReferer, pickSingleItem } from "../../rakuten.mjs";

test("検索 URL は、刷新後の新ドメインを指す", () => {
    assert.equal(SEARCH_URL, "https://openapi.rakuten.co.jp/services/api/BooksTotal/Search/20170404");
});

test("ISBN/JAN は、ハイフンと空白を除いた 8〜13 桁の数字だけを受け付ける", () => {
    assert.equal(normalizeIsbnJan("9784048704694"), "9784048704694");
    assert.equal(normalizeIsbnJan("978-4-04-870469-4"), "9784048704694");
    assert.equal(normalizeIsbnJan(" 9784048704694 "), "9784048704694");
    assert.equal(normalizeIsbnJan("49123456"), "49123456");
});

test("数字以外が混ざった ISBN/JAN は受け付けない（外部 API のクエリを書き換えられないように）", () => {
    for (const bad of [
        "9784048704694&applicationId=evil",
        "9784048704694%26x=1",
        "abc",
        "",
        "1234567",
        "12345678901234",
        undefined,
        null,
        9784048704694,
        {},
    ]) {
        assert.equal(normalizeIsbnJan(bad), undefined, String(bad));
    }
});

test("リクエストは、認証情報を URL ではなく params に載せる", () => {
    const req = buildRequest({ isbnjan: "9784048704694", applicationId: "APP-ID", accessKey: "pk_KEY" });

    assert.equal(req.url.includes("APP-ID"), false);
    assert.equal(req.url.includes("pk_KEY"), false);
    assert.deepEqual(req.params, { format: "json", isbnjan: "9784048704694", applicationId: "APP-ID", accessKey: "pk_KEY" });
});

test("Referer は、指定された場合だけ送る", () => {
    const base = { isbnjan: "9784048704694", applicationId: "a", accessKey: "k" };

    assert.deepEqual(buildRequest(base).headers, {});
    assert.deepEqual(buildRequest({ ...base, referer: "" }).headers, {});
    assert.deepEqual(buildRequest({ ...base, referer: "https://example.com/" }).headers, { Referer: "https://example.com/", Origin: "https://example.com" });
});

test("スキームの無いホスト名だけの Referer には、https:// を補う（楽天が URL として解釈できるように）", () => {
    // 実際に、ホスト名だけを設定して REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING になった形
    assert.equal(normalizeReferer("abc123.execute-api.ap-northeast-1.amazonaws.com"), "https://abc123.execute-api.ap-northeast-1.amazonaws.com/");
    assert.equal(
        buildRequest({ isbnjan: "9784048704694", applicationId: "a", accessKey: "k", referer: "abc123.execute-api.ap-northeast-1.amazonaws.com" }).headers.Referer,
        "https://abc123.execute-api.ap-northeast-1.amazonaws.com/",
    );
});

test("Referer と一緒に、Origin も送る。Origin はスキームとホスト名だけで、パスや末尾のスラッシュを付けない", () => {
    const base = { isbnjan: "9784048704694", applicationId: "a", accessKey: "k" };

    assert.deepEqual(
        buildRequest({ ...base, referer: "abc123.execute-api.ap-northeast-1.amazonaws.com" }).headers,
        { Referer: "https://abc123.execute-api.ap-northeast-1.amazonaws.com/", Origin: "https://abc123.execute-api.ap-northeast-1.amazonaws.com" },
    );
    assert.deepEqual(
        buildRequest({ ...base, referer: "https://example.com/Prod/" }).headers,
        { Referer: "https://example.com/Prod/", Origin: "https://example.com" },
    );
    assert.equal(buildRequest({ ...base, referer: "https://example.com:8443/x" }).headers.Origin, "https://example.com:8443");
});

test("Referer が空・不正なら、Origin も送らない", () => {
    const base = { isbnjan: "9784048704694", applicationId: "a", accessKey: "k" };

    assert.deepEqual(buildRequest({ ...base, referer: "" }).headers, {});
    assert.deepEqual(buildRequest({ ...base, referer: "not a url with spaces" }).headers, {});
});

test("スキームがあれば、そのまま使う（パスも保つ）", () => {
    assert.equal(normalizeReferer("https://example.com/"), "https://example.com/");
    assert.equal(normalizeReferer("https://example.com/Prod/"), "https://example.com/Prod/");
    assert.equal(normalizeReferer("https://example.com/Prod"), "https://example.com/Prod");
    assert.equal(normalizeReferer("http://example.com/"), "http://example.com/");
    assert.equal(normalizeReferer("HTTPS://Example.com/"), "https://example.com/");
});

test("Referer の前後の空白は取り除き、空・不正な値は送らない", () => {
    assert.equal(normalizeReferer("  https://example.com/  "), "https://example.com/");

    for (const bad of [undefined, null, "", "   ", 123, {}, "not a url with spaces", "https://"]) {
        assert.equal(normalizeReferer(bad), undefined, String(bad));
    }
    assert.deepEqual(buildRequest({ isbnjan: "9784048704694", applicationId: "a", accessKey: "k", referer: "not a url with spaces" }).headers, {});
});

test("検索結果が 1 件なら、フロントが前提とする { Item } の形で返す（大文字のキー）", () => {
    const item = { title: "本", largeImageUrl: "https://thumbnail.image.rakuten.co.jp/a.jpg" };

    assert.deepEqual(pickSingleItem({ Items: [{ Item: item }] }), { Item: item });
});

test("検索結果のキーが小文字(items / item)でも、同じ { Item } の形に揃える", () => {
    const item = { title: "本" };

    assert.deepEqual(pickSingleItem({ items: [{ item: item }] }), { Item: item });
    assert.deepEqual(pickSingleItem({ items: [item] }), { Item: item });
});

test("検索結果が 0 件・2 件以上・不正な形なら undefined", () => {
    assert.equal(pickSingleItem({ Items: [] }), undefined);
    assert.equal(pickSingleItem({ Items: [{ Item: {} }, { Item: {} }] }), undefined);
    assert.equal(pickSingleItem({}), undefined);
    assert.equal(pickSingleItem(undefined), undefined);
    assert.equal(pickSingleItem({ Items: "x" }), undefined);
    assert.equal(pickSingleItem({ Items: [null] }), undefined);
});

test("エラーから取り出すのは、上流のステータスとエラー文だけで、認証情報を含む URL は出さない", () => {
    // 503 のとき実際に返っていた AxiosError と同じ構造（認証情報は、ダミーの値に置き換えている）
    const error = Object.assign(new Error("Request failed with status code 503"), {
        name: "AxiosError",
        code: "ERR_BAD_RESPONSE",
        stack: "AxiosError: ... at file:///var/task/node_modules/axios/lib/core/settle.js",
        config: {
            url: "https://app.rakuten.co.jp/services/api/BooksTotal/Search/20170404?format=json&isbnjan=9784048704694&applicationId=SECRET-APP-ID&accessKey=pk_SECRET-KEY",
            headers: { Referer: "https://secret-referer.example.com/" },
        },
        response: { status: 503, data: { errors: { errorCode: 503, errorMessage: "Service Unavailable" } } },
    });

    const described = describeUpstreamError(error);

    assert.deepEqual(described, { upstreamStatus: 503, code: "ERR_BAD_RESPONSE", detail: "Service Unavailable" });

    const serialized = JSON.stringify(described);
    for (const secret of ["SECRET-APP-ID", "pk_SECRET-KEY", "secret-referer", "applicationId", "accessKey", "node_modules"]) {
        assert.equal(serialized.includes(secret), false, secret);
    }
});

test("旧 API 形式のエラー文(error_description)も取り出せる", () => {
    const described = describeUpstreamError({ response: { status: 400, data: { error: "wrong_parameter", error_description: "specify valid applicationId" } } });

    assert.equal(described.detail, "specify valid applicationId");
});

test("応答が無いエラー(タイムアウトなど)や、想定外の値でも落ちない", () => {
    assert.deepEqual(describeUpstreamError({ code: "ECONNABORTED" }), { upstreamStatus: undefined, code: "ECONNABORTED", detail: undefined });
    assert.deepEqual(describeUpstreamError(undefined), { upstreamStatus: undefined, code: undefined, detail: undefined });
    assert.deepEqual(describeUpstreamError("boom"), { upstreamStatus: undefined, code: undefined, detail: undefined });
});

test("エラー文が長い場合は切り詰める", () => {
    const described = describeUpstreamError({ response: { status: 500, data: { errors: { errorMessage: "x".repeat(1000) } } } });

    assert.equal(described.detail.length, 200);
});
