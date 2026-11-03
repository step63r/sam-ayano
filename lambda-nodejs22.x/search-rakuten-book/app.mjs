import axios from "axios";
import { buildRequest, describeUpstreamError, normalizeIsbnJan, pickSingleItem } from "./rakuten.mjs";

/**
 * レスポンスオブジェクトを生成する
 * @param {number} statusCode ステータスコード
 * @param {*} body
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

export const lambdaHandler = async (event, context) => {
    // イベント全体は認証トークンを含むため、ログに出さない
    let isbnjan;
    try {
        isbnjan = normalizeIsbnJan(JSON.parse(event.body ?? "{}").isbnjan);
    } catch {
        isbnjan = undefined;
    }

    if (!isbnjan) {
        return createResponse(400, { message: "ISBN/JANコードの形式が正しくありません。" });
    }

    const applicationId = process.env.RAKUTEN_APPLICATION_ID;
    const accessKey = process.env.RAKUTEN_ACCESS_KEY;

    if (!applicationId || !accessKey) {
        console.log("Rakuten credentials are not configured");
        return createResponse(500, { message: "楽天ブックスAPIの認証情報が設定されていません。" });
    }

    const request = buildRequest({
        isbnjan: isbnjan,
        applicationId: applicationId,
        accessKey: accessKey,
        referer: process.env.RAKUTEN_REFERER,
    });

    try {
        // Lambda のタイムアウト(3秒)より先に打ち切り、原因の分かるエラーを返す
        const r = await axios.get(request.url, {
            params: request.params,
            headers: request.headers,
            timeout: 2500,
        });

        const item = pickSingleItem(r.data);
        if (item) {
            return createResponse(200, item);
        }

        return createResponse(500, { message: "検索結果が1件ではありませんでした。" });
    } catch (error) {
        // axios のエラーオブジェクトは、認証情報を含む URL を持つため、そのまま返さずログにも出さない
        // Referer と Origin は、楽天に登録した許可サイトの URL で、秘匿情報ではない。
        // 「許可されたWebサイト」との不一致を切り分けるのに必要なため、実際に送った値を、ログとレスポンスに含める
        const detail = {
            ...describeUpstreamError(error),
            sentReferer: request.headers.Referer ?? null,
            sentOrigin: request.headers.Origin ?? null,
        };
        console.log("rakuten request failed", detail);
        return createResponse(502, { message: "楽天ブックスAPIの呼び出しに失敗しました。", ...detail });
    }
};
