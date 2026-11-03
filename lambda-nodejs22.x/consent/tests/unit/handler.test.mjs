import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler, CURRENT_TERMS_VERSION } from "../../handler.mjs";

/**
 * メモリ上の保存先。DynamoDB の「無い場合だけ保存」の挙動を再現する
 */
const createMemoryStore = (initial = []) => {
    const items = new Map(initial.map((i) => [`${i.userId}#${i.termsVersion}`, i]));
    return {
        items,
        getAgreement: async (userId, termsVersion) => items.get(`${userId}#${termsVersion}`),
        putAgreementIfAbsent: async (item) => {
            const key = `${item.userId}#${item.termsVersion}`;
            if (items.has(key)) return false;
            items.set(key, item);
            return true;
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (resource, claims, body) => ({
    resource,
    body: body === undefined ? null : JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

test("同意記録が無いユーザーは mustAgree になる", async () => {
    const handler = createHandler({ store: createMemoryStore() });

    const res = await handler(createEvent("/get-consent-status", { sub: "u1", email: "a@example.com" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), { currentVersion: CURRENT_TERMS_VERSION, mustAgree: true });
});

test("現在のバージョンに同意済みなら mustAgree にならず、同意日時を返す", async () => {
    const store = createMemoryStore([
        { userId: "u1", termsVersion: CURRENT_TERMS_VERSION, agreedAt: "2026-11-03T00:00:00.000Z" },
    ]);
    const handler = createHandler({ store });

    const res = await handler(createEvent("/get-consent-status", { sub: "u1" }));

    assert.deepEqual(parse(res), {
        currentVersion: CURRENT_TERMS_VERSION,
        mustAgree: false,
        agreedAt: "2026-11-03T00:00:00.000Z",
    });
});

test("古いバージョンにだけ同意済みのユーザーは、再同意が必要になる", async () => {
    const store = createMemoryStore([
        { userId: "u1", termsVersion: "2000-01-01", agreedAt: "2000-01-01T00:00:00.000Z" },
    ]);
    const handler = createHandler({ store });

    const res = await handler(createEvent("/get-consent-status", { sub: "u1" }));

    assert.equal(parse(res).mustAgree, true);
});

test("同意の記録は、JWT の sub と、サーバー側の現在バージョンで保存される", async () => {
    const store = createMemoryStore();
    const handler = createHandler({ store, now: () => new Date("2026-11-04T01:02:03.000Z") });

    const res = await handler(createEvent("/record-consent", { sub: "u1", email: "a@example.com" }));

    assert.equal(res.statusCode, 200);
    assert.deepEqual(parse(res), {
        currentVersion: CURRENT_TERMS_VERSION,
        mustAgree: false,
        agreedAt: "2026-11-04T01:02:03.000Z",
    });
    assert.deepEqual(store.items.get(`u1#${CURRENT_TERMS_VERSION}`), {
        userId: "u1",
        termsVersion: CURRENT_TERMS_VERSION,
        agreedAt: "2026-11-04T01:02:03.000Z",
        email: "a@example.com",
    });
});

test("リクエスト本文のユーザーIDやバージョンは無視される", async () => {
    const store = createMemoryStore();
    const handler = createHandler({ store });

    await handler(createEvent("/record-consent", { sub: "me" }, {
        userId: "victim",
        userName: "victim@example.com",
        termsVersion: "1999-01-01",
        version: "1999-01-01",
    }));

    assert.deepEqual([...store.items.keys()], [`me#${CURRENT_TERMS_VERSION}`]);
});

test("二重に記録しても、最初の同意日時が残る", async () => {
    const store = createMemoryStore();
    const first = createHandler({ store, now: () => new Date("2026-11-04T00:00:00.000Z") });
    const second = createHandler({ store, now: () => new Date("2026-11-09T00:00:00.000Z") });

    await first(createEvent("/record-consent", { sub: "u1" }));
    const res = await second(createEvent("/record-consent", { sub: "u1" }));

    assert.equal(parse(res).agreedAt, "2026-11-04T00:00:00.000Z");
    assert.equal(store.items.size, 1);
});

test("メールアドレスが無い場合でも記録できる（undefined を保存しない）", async () => {
    const store = createMemoryStore();
    const handler = createHandler({ store });

    await handler(createEvent("/record-consent", { sub: "u1" }));

    assert.equal("email" in store.items.get(`u1#${CURRENT_TERMS_VERSION}`), false);
});

test("認証情報(sub)が無い場合は 401 で、何も保存しない", async () => {
    const store = createMemoryStore();
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { email: "a@example.com" }]) {
        const res = await handler(createEvent("/record-consent", claims));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.items.size, 0);
});

test("未知のパスは 404", async () => {
    const handler = createHandler({ store: createMemoryStore() });

    const res = await handler(createEvent("/unknown", { sub: "u1" }));

    assert.equal(res.statusCode, 404);
});

test("保存先でエラーが起きたら 500 を返し、内部のエラー内容は漏らさない", async () => {
    const store = {
        getAgreement: async () => { throw new Error("secret internal detail"); },
        putAgreementIfAbsent: async () => true,
    };
    const handler = createHandler({ store });

    const res = await handler(createEvent("/get-consent-status", { sub: "u1" }));

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.includes("secret internal detail"), false);
});

test("レスポンスに CORS ヘッダーが付く", async () => {
    const handler = createHandler({ store: createMemoryStore() });

    const res = await handler(createEvent("/get-consent-status", { sub: "u1" }));

    assert.equal(res.headers["Access-Control-Allow-Origin"], "*");
});
