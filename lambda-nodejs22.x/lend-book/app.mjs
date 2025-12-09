import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

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

/**
 * シーケンス番号を取得して返す
 * @param {*} tableName テーブル名
 * @returns シーケンス番号
 */
const getNextSeq = async (tableName) => {
    const command = new UpdateCommand({
        TableName: "AtomicNumber",
        Key: {
            name: `${tableName}`
        },
        UpdateExpression: "set #v = if_not_exists(#v, :zero) + :val",
        ExpressionAttributeNames: {
            "#v": "value"
        },
        ExpressionAttributeValues: {
            ":val": 1,
            ":zero": 0,
        },
        ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
    console.log(response);

    return response.Attributes.value;
}

export const lambdaHandler = async (event, context) => {
    console.log("event", event);
    const { lender_username, renter_username, isbn } = JSON.parse(event.body);

    let response = {};

    try {
        // DynamoDBから書籍情報を取得
        const queryCommand = new QueryCommand({
            TableName: "Books",
            IndexName: "isbn-index",
            KeyConditionExpression: "#un = :un and #isbn = :isbn",
            ExpressionAttributeNames: {
                "#un": "username",
                "#isbn": "isbn"
            },
            ExpressionAttributeValues: {
                ":un": lender_username,
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

        // シーケンス番号の取得
        const seqNo = await getNextSeq("RentalBook");
        console.log("next seq =>", seqNo);
        
        // DynamoDBへの登録
        const putCommand = new PutCommand({
            TableName: "RentalBook",
            Item: {
                rental_id: seqNo,
                lender_username: lender_username,
                renter_username: renter_username,
                isbn: isbn,
                seqno: item.seqno,
                rental_date: Date.now(),
                return_flag: false,
            }
        });
        const putResult = await docClient.send(putCommand);
        console.log(putResult);

        // 書籍の貸出フラグを更新
        const updateCommand = new UpdateCommand({
            TableName: "Books",
            Key: {
                "username": lender_username,
                "seqno": item.seqno,
            },
            UpdateExpression: "set #lf = :true",
            ExpressionAttributeNames: {
                "#lf": "lendFlag",
            },
            ExpressionAttributeValues: {
                ":true": true,
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
