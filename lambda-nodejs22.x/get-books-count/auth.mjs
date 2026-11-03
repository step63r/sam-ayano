/**
 * 認証済みのユーザーIDを、API Gateway の Cognito オーソライザーが検証した JWT のクレームから取得する。
 * リクエスト本文の値は、他人のIDを指定してデータを操作できてしまうため、絶対に信用しない。
 * メールアドレスは変更できるため、データのキー（Books.username など）には変更されない sub を使う。
 *
 * このファイルは各関数のディレクトリに同じ内容を置いている（関数ごとに CodeUri が分かれているため）。
 * 変更する場合は、すべてのコピーを同時に更新すること。
 * @param {*} event Lambda のイベント
 * @returns ユーザーID（sub）。取得できなければ undefined
 */
export const getUserName = (event) => {
    const sub = event?.requestContext?.authorizer?.claims?.sub;

    return typeof sub === "string" && sub !== "" ? sub : undefined;
};
