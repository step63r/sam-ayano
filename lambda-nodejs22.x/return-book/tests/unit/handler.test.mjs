import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../../handler.mjs";
import { getUserName } from "../../auth.mjs";

/**
 * メモリ上の保存先。DynamoDB の条件付き更新（貸出者の一致・未返却）の挙動を再現する
 */
const createMemoryStore = (rentals = [], books = []) => {
    const rentalMap = new Map(rentals.map((r) => [r.rental_id, { ...r }]));
    const bookMap = new Map(books.map((b) => [`${b.username}#${b.seqno}`, { ...b }]));
    return {
        rentalMap,
        bookMap,
        markRentalReturned: async (rentalId, lenderUsername, returnDate) => {
            const rental = rentalMap.get(rentalId);
            if (!rental || rental.lender_username !== lenderUsername || rental.return_flag !== false) {
                return undefined;
            }
            rental.return_flag = true;
            rental.return_date = returnDate;
            return { ...rental };
        },
        markBookReturned: async (username, seqno) => {
            bookMap.get(`${username}#${seqno}`).lendFlag = false;
        },
    };
};

/** API Gateway の Cognito オーソライザー経由のイベントを作る */
const createEvent = (claims, body) => ({
    body: JSON.stringify(body),
    requestContext: { authorizer: claims ? { claims } : undefined },
});

const parse = (response) => JSON.parse(response.body);

const createFixture = () => createMemoryStore(
    [{ rental_id: 1, lender_username: "owner@example.com", renter_username: "friend@example.com", seqno: 10, return_flag: false }],
    [{ username: "owner@example.com", seqno: 10, lendFlag: true }],
);

test("貸出者本人は返却でき、貸出記録と書籍の貸出フラグが更新される", async () => {
    const store = createFixture();
    const handler = createHandler({ store, now: () => 12345 });

    const res = await handler(createEvent({ sub: "owner@example.com" }, { rental_id: 1 }));

    assert.equal(res.statusCode, 200);
    assert.equal(store.rentalMap.get(1).return_flag, true);
    assert.equal(store.rentalMap.get(1).return_date, 12345);
    assert.equal(store.bookMap.get("owner@example.com#10").lendFlag, false);
});

test("貸出者以外は返却できず、何も更新されない", async () => {
    const store = createFixture();
    const handler = createHandler({ store });

    const res = await handler(createEvent({ sub: "attacker@example.com" }, { rental_id: 1 }));

    assert.equal(res.statusCode, 404);
    assert.equal(store.rentalMap.get(1).return_flag, false);
    assert.equal(store.bookMap.get("owner@example.com#10").lendFlag, true);
});

test("本文に貸出者の名前を入れても、認証済みのユーザーとして扱われる", async () => {
    const store = createFixture();
    const handler = createHandler({ store });

    const res = await handler(createEvent(
        { sub: "attacker@example.com" },
        { rental_id: 1, userName: "owner@example.com", lender_username: "owner@example.com" },
    ));

    assert.equal(res.statusCode, 404);
    assert.equal(store.rentalMap.get(1).return_flag, false);
});

test("存在しない貸出IDは、他人の貸出と同じ応答になる", async () => {
    const handler = createHandler({ store: createFixture() });

    const res = await handler(createEvent({ sub: "owner@example.com" }, { rental_id: 999 }));

    assert.equal(res.statusCode, 404);
});

test("返却済みの貸出は、再度返却できない", async () => {
    const store = createFixture();
    const handler = createHandler({ store });
    await handler(createEvent({ sub: "owner@example.com" }, { rental_id: 1 }));
    store.bookMap.get("owner@example.com#10").lendFlag = true;

    const res = await handler(createEvent({ sub: "owner@example.com" }, { rental_id: 1 }));

    assert.equal(res.statusCode, 404);
    assert.equal(store.bookMap.get("owner@example.com#10").lendFlag, true);
});

test("認証情報が無ければ 401 を返し、何も更新されない", async () => {
    const store = createFixture();
    const handler = createHandler({ store });

    for (const claims of [undefined, {}, { sub: "" }, { sub: 123 }]) {
        const res = await handler(createEvent(claims, { rental_id: 1 }));
        assert.equal(res.statusCode, 401);
    }
    assert.equal(store.rentalMap.get(1).return_flag, false);
});

test("getUserName は sub クレームだけを使い、本文は参照しない", () => {
    assert.equal(getUserName({ requestContext: { authorizer: { claims: { sub: "a@example.com" } } } }), "a@example.com");
    assert.equal(getUserName({ body: JSON.stringify({ userName: "b@example.com" }) }), undefined);
    assert.equal(getUserName(undefined), undefined);
});
