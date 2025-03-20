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
    const { userName } = JSON.parse(event.body);

    let response = {};

    try {
        // コマンドの構築
        let commandInput = {
            TableName: "Books",
            KeyConditionExpression: "#un = :un",
            ExpressionAttributeNames: { "#un": "username" },
            ExpressionAttributeValues: { ":un": userName },
            Select: "COUNT",
            ConsistentRead: true,
        };

        let count = 0;
        let currentLastEvaluatedKey = undefined;
        let onceRead = false;
        
        while (!onceRead || currentLastEvaluatedKey) {
            commandInput.ExclusiveStartKey = currentLastEvaluatedKey;
            console.log("query command", commandInput);

            const queryResult = await docClient.send(new QueryCommand(commandInput));
            console.log("query result", queryResult);

            if (queryResult?.Count) {
                count += queryResult.Count;
            }

            if (queryResult?.LastEvaluatedKey) {
                currentLastEvaluatedKey = queryResult?.LastEvaluatedKey;
            } else {
                currentLastEvaluatedKey = undefined;
                break;
            }

            if (!onceRead) {
                onceRead = true;
            }
        }

        response = createResponse(200, {
            count: count,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
