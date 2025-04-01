import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

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
    const { userName, seqno } = JSON.parse(event.body);

    let response = {};

    try {
        const command = new DeleteCommand({
            TableName: "Books",
            Key: {
                "username": userName,
                "seqno": seqno
            },
        });

        const deleteResult = await docClient.send(command);
        console.log(deleteResult);
        response = createResponse(200, {
            result: true,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
