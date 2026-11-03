/**
 * 楽天ブックス総合検索 API の URL。
 * 楽天ウェブサービスは 2026 年 2 月に刷新され、新ドメインに移った。
 * 旧ドメイン(app.rakuten.co.jp)と、旧アカウントで発行された数字の applicationId は使えない。
 * 新方式では、UUID 形式の applicationId に加えて accessKey が必須
 */
export const SEARCH_URL = "https://openapi.rakuten.co.jp/services/api/BooksTotal/Search/20170404";

/** エラーの詳細文の長さの上限（レスポンスに載せる量を絞るため） */
const MAX_DETAIL_LENGTH = 200;

/**
 * クライアントから受け取った ISBN/JAN を検証・整形する。
 * 外部 API へのリクエストに使うため、数字以外が混ざったものは受け付けない。
 * 入力しやすいよう、ハイフンと空白は取り除く
 * @param {*} value ISBN/JANコード
 * @returns 8〜13桁の数字の文字列。形式が正しくなければ undefined
 */
export const normalizeIsbnJan = (value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const digits = value.replace(/[-\s]/g, "");
    return /^\d{8,13}$/.test(digits) ? digits : undefined;
};

/**
 * 設定された Referer を、HTTP の Referer ヘッダーとして正しい URL の形に整える。
 * Referer は `https://ホスト名/` の形が正しい。スキームの無いホスト名だけの値を、そのまま送ると、
 * 楽天側で URL として解釈できず「Referer が無い」と扱われる(REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING)ため、
 * スキームが無ければ https:// を補う
 * @param {*} value 設定された値（楽天の管理画面に登録した許可サイトと同じもの）
 * @returns 整えた URL。空や、URL として解釈できない値なら undefined
 */
export const normalizeReferer = (value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return undefined;
    }

    try {
        const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
        return url.href;
    } catch {
        return undefined;
    }
};

/**
 * 楽天ブックス総合検索 API へのリクエスト内容を組み立てる。
 * 認証情報はクエリパラメーターで渡す（ヘッダーで渡す場合の名前が公式ドキュメントに無いため）。
 * URL に認証情報を連結せず、axios の params に任せることで、エラーオブジェクトの url に残りにくくしている
 * @param {object} input 入力
 * @param {string} input.isbnjan ISBN/JANコード
 * @param {string} input.applicationId 楽天のアプリケーションID
 * @param {string} input.accessKey 楽天のアクセスキー
 * @param {string} [input.referer] 楽天の管理画面で「許可されたWebサイト」に登録した値。空なら送らない。
 *   スキームが無ければ https:// を補う（normalizeReferer）。Referer と、そこから作った Origin の両方で送る
 */
export const buildRequest = ({ isbnjan, applicationId, accessKey, referer }) => {
    const normalizedReferer = normalizeReferer(referer);

    // 楽天の新しいゲートウェイは、Referer だけでは REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING になり、
    // Origin を送ると通ったという報告がある（公式ドキュメントには記載が無い）。どちらを見ているか確実でないため、
    // 両方を、登録した許可サイトと同じ値で送る。Origin は、スキームとホスト名だけの形（パスや末尾のスラッシュは付けない）
    const headers = normalizedReferer
        ? { Referer: normalizedReferer, Origin: new URL(normalizedReferer).origin }
        : {};

    return {
        url: SEARCH_URL,
        params: {
            format: "json",
            isbnjan: isbnjan,
            applicationId: applicationId,
            accessKey: accessKey,
        },
        headers: headers,
    };
};

/**
 * 検索結果から、ちょうど 1 件の書籍を取り出す。
 * 呼び出し側(フロント)が `{ Item: {...} }` の形を前提にしているため、その形に揃えて返す。
 * 刷新後の API は、キー名が小文字(items / item)になっている可能性があるため、どちらも受け付ける
 * @param {*} data 楽天ブックス総合検索 API のレスポンス本文
 * @returns `{ Item }`。1 件でなければ undefined
 */
export const pickSingleItem = (data) => {
    const items = data?.Items ?? data?.items;

    if (!Array.isArray(items) || items.length !== 1) {
        return undefined;
    }

    const first = items[0];
    const item = first?.Item ?? first?.item ?? first;

    return item && typeof item === "object" ? { Item: item } : undefined;
};

/**
 * 外部 API 呼び出しのエラーから、クライアントに返してよい項目だけを取り出す。
 * axios のエラーオブジェクトは、リクエストの URL（認証情報を含む）やヘッダーを持つため、
 * そのまま返してはいけない
 * @param {*} error エラー
 */
export const describeUpstreamError = (error) => {
    const rakutenMessage = error?.response?.data?.errors?.errorMessage ?? error?.response?.data?.error_description;

    return {
        upstreamStatus: typeof error?.response?.status === "number" ? error.response.status : undefined,
        code: typeof error?.code === "string" ? error.code : undefined,
        detail: typeof rakutenMessage === "string" ? rakutenMessage.slice(0, MAX_DETAIL_LENGTH) : undefined,
    };
};
