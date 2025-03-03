import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

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
        body: JSON.stringify(body)
    };
};

export const lambdaHandler = async (event, context) => {
    console.log("event", event);
    const { userName, seqno } = JSON.parse(event.body);

    let response = {};

    try {
        const command = new GetCommand({
            TableName: "Books",
            Key: {
                "username": userName,
                "seqno": seqno
            },
        });

        const getResult = await docClient.send(command);
        console.log(getResult);
        response = createResponse(200, {
            items: getResult?.Item,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
