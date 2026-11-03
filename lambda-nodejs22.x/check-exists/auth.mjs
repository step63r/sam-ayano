/**
 * 認証済みのユーザー名を、API Gateway の Cognito オーソライザーが検証した JWT のクレームから取得する。
 * リクエスト本文の値は、他人の名前を指定してデータを操作できてしまうため、絶対に信用しない。
 * 既存データの username（ログイン時のメールアドレス）と一致させるため、email クレームを使う。
 *
 * このファイルは各関数のディレクトリに同じ内容を置いている（関数ごとに CodeUri が分かれているため）。
 * 変更する場合は、すべてのコピーを同時に更新すること。
 * @param {*} event Lambda のイベント
 * @returns ユーザー名。取得できなければ undefined
 */
export const getUserName = (event) => {
    const email = event?.requestContext?.authorizer?.claims?.email;

    return typeof email === "string" && email !== "" ? email : undefined;
};
