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
    const { userName, pageSize, lastEvaluatedKey, ...params } = JSON.parse(event.body);

    let response = {};

    try {
        // コマンドの構築
        let commandInput = {
            TableName: "Books",
            KeyConditionExpression: "#un = :un",
            ExpressionAttributeNames: { "#un": "username" },
            ExpressionAttributeValues: { ":un": userName },
            ProjectionExpression: "seqno, author, publisherName, title",
            Limit: pageSize,
            ConsistentRead: true,
        };

        if (params.isbn) {
            commandInput.IndexName = "isbn-index";
            commandInput.KeyConditionExpression += " and #isbn = :isbn";
            commandInput.ExpressionAttributeNames["#isbn"] = "isbn";
            commandInput.ExpressionAttributeValues[":isbn"] = params.isbn;
        }

        if (params.keyword) {
            commandInput.FilterExpression = "contains(#author, :keyword) or contains(#publisherName, :keyword) or contains(#title, :keyword)";
            commandInput.ExpressionAttributeNames["#author"] = "author";
            commandInput.ExpressionAttributeNames["#publisherName"] = "publisherName";
            commandInput.ExpressionAttributeNames["#title"] = "title";
            commandInput.ExpressionAttributeValues[":keyword"] = params.keyword;
        }

        let currentLength = 0;
        let currentLastEvaluatedKey = lastEvaluatedKey;
        let items = [];

        // 取得件数がpageSizeに到達するまでQueryし続ける
        while (currentLength < pageSize) {
            commandInput.ExclusiveStartKey = currentLastEvaluatedKey;
            console.log("query command", commandInput);

            const queryResult = await docClient.send(new QueryCommand(commandInput));
            console.log("query result", queryResult);

            // それまでの取得件数 + 今回の取得件数 > pageSize となる場合、
            // pazeSize件になるように今回の件数をスライスする
            if (currentLength + queryResult?.Items.length > pageSize) {
                const sliceItems = queryResult?.Items.slice(0, pageSize - currentLength);
                items.push(...sliceItems);
                currentLength += sliceItems.length;
            } else {
                items.push(...queryResult?.Items);
                currentLength += queryResult?.Items.length;
            }

            // LastEvaluatedKeyがあれば次のコマンドに入れ、
            // なければcurrentLastEvaluatedKeyを未セットにしてループを抜ける
            if (queryResult?.LastEvaluatedKey) {
                currentLastEvaluatedKey = queryResult?.LastEvaluatedKey;
            } else {
                currentLastEvaluatedKey = undefined;
                break;
            }
        }

        response = createResponse(200, {
            items: items,
            lastEvaluatedKey: currentLastEvaluatedKey,
        });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
