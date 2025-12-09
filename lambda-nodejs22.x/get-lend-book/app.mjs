import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamodbClient = new DynamoDBClient({
    region: 'ap-northeast-1',
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

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
    console.log("event", event);
    const { userName, isbn } = JSON.parse(event.body);

    let response = {};

    try {
        const queryCommand = new QueryCommand({
            TableName: "Books",
            IndexName: "isbn-index",
            KeyConditionExpression: "#un = :un and #isbn = :isbn",
            ExpressionAttributeNames: {
                "#un": "username",
                "#isbn": "isbn"
            },
            ExpressionAttributeValues: {
                ":un": userName,
                ":isbn": isbn
            },
            Limit: 300,
            ConsistentRead: true,
        });
        const queryResult = await docClient.send(queryCommand);
        console.log(queryResult);

        // queryResultのItemから最初に見つかったlendFlagがfalseの項目をgetResultとする
        let item = null;
        for (const i of queryResult.Items) {
            if (i.lendFlag === undefined || i.lendFlag === false) {
                item = i;
                break;
            }
        }

        // 見つからない場合は500エラーを返す
        if (!item) {
            response = createResponse(500, { message: "貸出可能な書籍が見つかりません。" });
            return response;
        }

        response = createResponse(200, {
            item: item,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
