// 実行: node --test update-books/tests/unit/cover.test.mjs
// （この Lambda の package.json の test は mocha の雛形のままのため、node:test で単体で実行する）
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCoverUrl } from "../../cover.mjs";

test("https の URL はそのまま受け付ける", () => {
    assert.equal(
        normalizeCoverUrl("https://cover.openbd.jp/9784798121963.jpg"),
        "https://cover.openbd.jp/9784798121963.jpg",
    );
    assert.equal(
        normalizeCoverUrl("https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/1963/9784798121963.jpg?_ex=200x200"),
        "https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/1963/9784798121963.jpg?_ex=200x200",
    );
});

test("前後の空白は取り除く", () => {
    assert.equal(normalizeCoverUrl("  https://example.com/a.jpg \n"), "https://example.com/a.jpg");
});

test("https 以外のスキームは受け付けない", () => {
    for (const bad of [
        "http://example.com/a.jpg",
        "javascript:alert(1)",
        "data:image/png;base64,AAAA",
        "ftp://example.com/a.jpg",
        "//example.com/a.jpg",
        "example.com/a.jpg",
    ]) {
        assert.equal(normalizeCoverUrl(bad), undefined, bad);
    }
});

test("文字列以外・空・長すぎる値は受け付けない", () => {
    for (const bad of [undefined, null, 123, {}, [], "", "   "]) {
        assert.equal(normalizeCoverUrl(bad), undefined, String(bad));
    }
    assert.equal(normalizeCoverUrl("https://example.com/" + "a".repeat(500)), undefined);
});

test("空白や制御文字を含む URL は受け付けない", () => {
    assert.equal(normalizeCoverUrl("https://example.com/a b.jpg"), undefined);
    assert.equal(normalizeCoverUrl("https://example.com/a\u0000.jpg"), undefined);
    assert.equal(normalizeCoverUrl("https://example.com/a\n.jpg"), undefined);
});

test("URL として解釈できない値は受け付けない", () => {
    assert.equal(normalizeCoverUrl("https://"), undefined);
});
