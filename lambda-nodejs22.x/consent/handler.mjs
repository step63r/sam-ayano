/**
 * 利用規約・プライバシーポリシーの結合バージョン（改定日）。
 * 両者は 1 つのバージョンで管理する。
 *
 * 本文（frontend/src/components/Terms.tsx、PrivacyPolicy.tsx）を実質的に変更した場合は、
 * 必ずこの値を更新すること。更新しないと、既存ユーザーに再同意を求められない。
 */
export const CURRENT_TERMS_VERSION = "2026-11-03";

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
 * 現在の規約バージョンに対する同意状況を返す
 * @param {object} store 同意記録の保存先
 * @param {string} userId ユーザーID
 */
const getConsentStatus = async (store, userId) => {
    const agreement = await store.getAgreement(userId, CURRENT_TERMS_VERSION);

    return {
        currentVersion: CURRENT_TERMS_VERSION,
        mustAgree: !agreement,
        ...(agreement ? { agreedAt: agreement.agreedAt } : {}),
    };
};

/**
 * 現在の規約バージョンへの同意を記録する
 * @param {object} store 同意記録の保存先
 * @param {string} userId ユーザーID
 * @param {string | undefined} email メールアドレス
 * @param {Date} now 現在時刻
 */
const recordConsent = async (store, userId, email, now) => {
    // 同意した日時の証跡を残すため、すでに同意済みなら最初の記録を上書きしない。
    // 二重送信や再試行でも、初回の同意日時がそのまま残る
    await store.putAgreementIfAbsent({
        userId: userId,
        termsVersion: CURRENT_TERMS_VERSION,
        agreedAt: now.toISOString(),
        ...(email ? { email: email } : {}),
    });

    return await getConsentStatus(store, userId);
};

/**
 * ハンドラーを生成する。保存先を外から渡せるようにしているのは、DynamoDB なしでテストするため
 * @param {object} deps 依存
 * @param {object} deps.store 同意記録の保存先
 * @param {() => Date} [deps.now] 現在時刻の取得関数
 */
export const createHandler = ({ store, now = () => new Date() }) => async (event) => {
    // ユーザーは必ず認証済みの JWT のクレームから取得する。
    // リクエストの本文は一切参照しない（他人の同意を記録・参照できてしまうのを防ぐため）。
    // また、バージョンも本文から受け取らず、常に CURRENT_TERMS_VERSION を記録する
    const claims = event?.requestContext?.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
        return createResponse(401, { message: "認証情報を取得できませんでした" });
    }

    try {
        switch (event.resource) {
            case "/get-consent-status":
                return createResponse(200, await getConsentStatus(store, userId));
            case "/record-consent":
                return createResponse(200, await recordConsent(store, userId, claims.email, now()));
            default:
                return createResponse(404, { message: "Not Found" });
        }
    } catch (error) {
        // イベント全体は認証トークンを含むためログに出さない
        console.log("consent error", error?.name, error?.message);
        return createResponse(500, { message: "同意状況の処理に失敗しました" });
    }
};
