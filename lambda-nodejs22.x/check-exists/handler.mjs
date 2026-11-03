import { getUserName } from "./auth.mjs";

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

/**
 * ハンドラーを生成する。DynamoDB を呼ぶ部分を外から渡せるようにしているのは、SDK なしでテストするため
 * @param {object} deps 依存
 * @param {object} deps.store DynamoDB への問い合わせ（query。引数は DynamoDB の各コマンドの入力）
 */
export const createHandler = ({ store }) => async (event, context) => {
    console.log("event", event);
    const userName = getUserName(event);
    if (!userName) {
        return createResponse(401, { message: "認証情報を取得できませんでした" });
    }
    const { isbn } = JSON.parse(event.body);

    let response = {};

    try {
        // コマンドの構築
        let commandInput = {
            TableName: "Books",
            IndexName: "isbn-index",
            KeyConditionExpression: "#un = :un and #isbn = :isbn",
            ExpressionAttributeNames: {
                "#un": "username",
                "#isbn": "isbn",
            },
            ExpressionAttributeValues: {
                ":un": userName,
                ":isbn": isbn,
            },
            ProjectionExpression: "seqno",
            ConsistentRead: true,
        };

        let currentLastEvaluatedKey = undefined;
        let isFound = false;

        while (true) {
            commandInput.ExclusiveStartKey = currentLastEvaluatedKey;
            console.log("query command", commandInput);

            const queryResult = await store.query(commandInput);
            console.log("query result", queryResult);

            if (queryResult?.Items.length > 0) {
                isFound = true;
                break;
            }

            if (queryResult?.LastEvaluatedKey) {
                currentLastEvaluatedKey = queryResult?.LastEvaluatedKey;
            } else {
                break;
            }
        }

        response = createResponse(200, {
            result: isFound
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
