/** 書影URLの長さの上限。DynamoDB の項目サイズを不用意に増やさないための歯止め */
const MAX_COVER_URL_LENGTH = 500;

/**
 * クライアントから受け取った書影URLを検証する。
 * 書影はブラウザの img 要素に直接渡されるため、https の URL だけを受け付ける
 * （http は https のページで読み込めず、javascript: などの別のスキームは受け付けない）。
 * @param {*} value 書影URL
 * @returns 検証を通った書影URL。通らなければ undefined（保存しない）
 */
export const normalizeCoverUrl = (value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const url = value.trim();

    if (url.length === 0 || url.length > MAX_COVER_URL_LENGTH) {
        return undefined;
    }

    // 空白や制御文字を含む URL は受け付けない
    if (/[\s\u0000-\u001f\u007f]/.test(url)) {
        return undefined;
    }

    try {
        return new URL(url).protocol === "https:" ? url : undefined;
    } catch {
        return undefined;
    }
};
