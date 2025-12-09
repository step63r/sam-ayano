import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamodbClient = new DynamoDBClient({
    region: 'ap-northeast-1',
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

/**
 * レスポンスオブジェクトを生成する
 * @param {number} statusCode ステータスコード
 * @param {*} body レスポンスボディ
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
    const { rental_id } = JSON.parse(event.body);

    let response = {};

    try {
        // DynamoDBの更新
        const updateCommand = new UpdateCommand({
            TableName: "RentalBook",
            Key: {
                rental_id: rental_id,
            },
            UpdateExpression: "set #rf = :true, #rd = :rd",
            ExpressionAttributeNames: {
                "#rf": "return_flag",
                "#rd": "return_date",
            },
            ExpressionAttributeValues: {
                ":true": true,
                ":rd": Date.now(),
            },
        });
        const updateResult = await docClient.send(updateCommand);
        console.log(updateResult);

        response = createResponse(200, { message: "OK" });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
