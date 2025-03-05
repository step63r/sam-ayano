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
    const { userName, pageSize, lastEvaluatedKey } = JSON.parse(event.body);

    let response = {};
    let startKey = lastEvaluatedKey ?? 0;

    try {
        const command = new QueryCommand({
            TableName: "Books",
            KeyConditionExpression: "#un = :un",
            ExpressionAttributeNames: {
                "#un": "username"
            },
            ExpressionAttributeValues: {
                ":un": userName
            },
            ProjectionExpression: "seqno, author, publisherName, title",
            ExclusiveStartKey: {
                username: userName,
                seqno: startKey,
            },
            Limit: pageSize,
            ConsistentRead: true,
        });

        const queryResult = await docClient.send(command);
        console.log(queryResult);
        response = createResponse(200, {
            items: queryResult?.Items,
            lastEvaluatedKey: queryResult?.LastEvaluatedKey,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
