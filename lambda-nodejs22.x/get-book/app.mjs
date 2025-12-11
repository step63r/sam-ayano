import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

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
    let item = {};

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

        item = { ...getResult.Item };
        
        if (getResult?.Item?.lendFlag) {
            const queryCommand = new QueryCommand({
                TableName: "RentalBook",
                IndexName: "lender-seqno-index",
                KeyConditionExpression: "#lun = :lun and #seqno = :seqno",
                ExpressionAttributeNames: {
                    "#lun": "lender_username",
                    "#seqno": "seqno"
                },
                ExpressionAttributeValues: {
                    ":lun": userName,
                    ":seqno": seqno
                },
                ProjectionExpression: "rental_id, renter_username, rental_date",
                Limit: 1,
            });
            const queryResult = await docClient.send(queryCommand);
            console.log("queryResult", queryResult);
            item.rentalId = queryResult.Items[0]?.rental_id;
            item.renterUsername = queryResult.Items[0]?.renter_username || "";
            item.rentalDate = queryResult.Items[0]?.rental_date || 0;
        }

        response = createResponse(200, {
            items: item,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
