// 実行: npm test（各 Lambda のディレクトリで）
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCoverOnlyUpdate, normalizeCoverUrl } from "../../cover.mjs";

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

test("書影だけの更新は、coverUrl の属性だけを書き換える", () => {
    const input = buildCoverOnlyUpdate("user@example.com", 7, "https://cover.openbd.jp/9784798121963.jpg");

    assert.deepEqual(input.Key, { username: "user@example.com", seqno: 7 });
    assert.equal(input.UpdateExpression, "set #cu = :cu");
    assert.deepEqual(input.ExpressionAttributeNames, { "#cu": "coverUrl" });
    assert.deepEqual(input.ExpressionAttributeValues, { ":cu": "https://cover.openbd.jp/9784798121963.jpg" });
});

test("書影だけの更新は、存在しない本の行を作らない（条件式）", () => {
    const input = buildCoverOnlyUpdate("user@example.com", 7, "https://example.com/a.jpg");

    assert.equal(input.ConditionExpression, "attribute_exists(seqno)");
});

test("書影だけの更新は、タイトルなど他の属性を一切含まない", () => {
    const input = buildCoverOnlyUpdate("user@example.com", 7, "https://example.com/a.jpg");
    const serialized = JSON.stringify(input);

    for (const attr of ["title", "author", "publisherName", "salesDate", "readFlag", "note", "lendFlag", "isbn"]) {
        assert.equal(serialized.includes(`"${attr}"`), false, attr);
    }
});
