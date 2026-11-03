import { getUserName } from "./auth.mjs";

/**
 * レスポンスオブジェクトを生成する
 * @param {number} statusCode ステータスコード
 * @param {*} body レスポンスボディ
 * @returns レスポンスオブジェクト
 */
const createResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type,X-CSRF-TOKEN,Authorization",
        },
    };
};

/**
 * ハンドラーを生成する。保存先を外から渡せるようにしているのは、DynamoDB なしでテストするため
 * @param {object} deps 依存
 * @param {object} deps.store 貸出記録と書籍の保存先
 * @param {() => number} [deps.now] 現在時刻（エポックミリ秒）の取得関数
 */
export const createHandler = ({ store, now = () => Date.now() }) => async (event) => {
    console.log("event", event);

    // 返却できるのは、本を貸し出した本人だけ。rental_id は連番で推測できるため、
    // 所有者の確認なしに受け付けると、他人の貸出を返却済みにできてしまう
    const userName = getUserName(event);
    if (!userName) {
        return createResponse(401, { message: "認証情報を取得できませんでした" });
    }

    const { rental_id } = JSON.parse(event.body);

    try {
        const rental = await store.markRentalReturned(rental_id, userName, now());

        // 他人の貸出・存在しない貸出・返却済みの貸出は区別せず、同じ応答にする。
        // 区別すると、他人の貸出が存在するかどうかを探れてしまう
        if (!rental) {
            return createResponse(404, { message: "返却できる貸出が見つかりません。" });
        }

        await store.markBookReturned(rental.lender_username, rental.seqno);

        return createResponse(200, { message: "OK" });
    } catch (error) {
        console.log("error", error);
        return createResponse(500, error);
    }
};
