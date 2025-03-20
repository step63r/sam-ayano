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
            "Access-Control-Allow-Headers": "Content-Type,X-CSRF-TOKEN",
        },
    };
};

export const lambdaHandler = async (event, context) => {
    console.log("event", event);
    const { userName, isbn } = JSON.parse(event.body);

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

            const queryResult = await docClient.send(new QueryCommand(commandInput));
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
