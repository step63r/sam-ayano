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
    const { userName, pageSize, lastEvaluatedKey, ...params } = JSON.parse(event.body);

    let response = {};

    try {
        // コマンドの構築
        let commandInput = {
            TableName: "Books",
            KeyConditionExpression: "#un = :un",
            ExpressionAttributeNames: { "#un": "username" },
            ExpressionAttributeValues: { ":un": userName },
            ProjectionExpression: "seqno, author, publisherName, title, titleKana, salesDate, lendFlag",
            Limit: pageSize,
            ConsistentRead: true,
        };

        if (params.isbn) {
            commandInput.IndexName = "isbn-index";
            commandInput.KeyConditionExpression += " and #isbn = :isbn";
            commandInput.ExpressionAttributeNames["#isbn"] = "isbn";
            commandInput.ExpressionAttributeValues[":isbn"] = params.isbn;
        }

        if (params.sortKeyId) {
            // sortKeyId
            //  1: title
            //  2: titleKana
            //  3: salesDate
            if (params.sortKeyId === 1) {
                commandInput.IndexName = "title-index";
            } else if (params.sortKeyId === 2) {
                commandInput.IndexName = "titleKana-index";
            } else if (params.sortKeyId === 3) {
                commandInput.IndexName = "salesDate-index";
            }
        }

        if (params.desc) {
            // 降順ソート
            commandInput.ScanIndexForward = false;
        }

        if (params.keyword) {
            commandInput.FilterExpression = "contains(#author, :keyword) or contains(#publisherName, :keyword) or contains(#title, :keyword)";
            commandInput.ExpressionAttributeNames["#author"] = "author";
            commandInput.ExpressionAttributeNames["#publisherName"] = "publisherName";
            commandInput.ExpressionAttributeNames["#title"] = "title";
            commandInput.ExpressionAttributeValues[":keyword"] = params.keyword;
		}
		
		if (params.unreadFlag) {
			commandInput.FilterExpression = (commandInput.FilterExpression ? commandInput.FilterExpression + " and " : "") + "#readFlag = :readFlag";
			commandInput.ExpressionAttributeNames["#readFlag"] = "readFlag";
			commandInput.ExpressionAttributeValues[":readFlag"] = false;
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

            items.push(...queryResult?.Items);
            currentLength += queryResult?.Items.length;

            // LastEvaluatedKeyがあれば次のコマンドに入れ、
            // なければcurrentLastEvaluatedKeyを未セットにしてループを抜ける
            if (queryResult?.LastEvaluatedKey) {
                currentLastEvaluatedKey = queryResult?.LastEvaluatedKey;
            } else {
                currentLastEvaluatedKey = undefined;
                break;
            }
        }

        // 取得結果がpageSizeより多い場合はスライスする
        if (items.length > pageSize && currentLastEvaluatedKey) {
            items = items.slice(0, pageSize);
            const lastItem = items[items.length - 1];
            
            // LastEvaluatedKeyを正しく構築
            currentLastEvaluatedKey = {
                username: userName,
                seqno: lastItem.seqno
            };
            
            // GSIを使用している場合は、該当するソートキーも追加
            if (params.sortKeyId === 1 && lastItem.title) {
                currentLastEvaluatedKey.title = lastItem.title;
            } else if (params.sortKeyId === 2 && lastItem.titleKana) {
                currentLastEvaluatedKey.titleKana = lastItem.titleKana;
            } else if (params.sortKeyId === 3 && lastItem.salesDate) {
                currentLastEvaluatedKey.salesDate = lastItem.salesDate;
            }
            
            console.log("Constructed LastEvaluatedKey:", currentLastEvaluatedKey);
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
