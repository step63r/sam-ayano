import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

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

/**
 * シーケンス番号を取得して返す
 * @param {*} tableName テーブル名
 * @param {*} userName ユーザー名
 * @returns シーケンス番号
 */
const getNextSeq = async (tableName, userName) => {
    const command = new UpdateCommand({
        TableName: "AtomicNumber",
        Key: {
            name: `${tableName}-${userName}`
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
    const { userName, data } = JSON.parse(event.body);

    let response = {};

    try {
        if (data.seqno) {
            // DynamoDBへの登録
            const command = new UpdateCommand({
                TableName: "Books",
                Key: {
                    username: userName,
                    seqno: data.seqno,
                },
                UpdateExpression: "set #at = :at, #pn = :pn, #sd = :sd, #t = :t, #tk = :tk, #rf = :rf, #note = :note",
                ExpressionAttributeNames: {
                    "#at": "author",
                    "#pn": "publisherName",
                    "#sd": "salesDate",
                    "#t": "title",
                    "#tk": "titleKana",
                    "#rf": "readFlag",
                    "#note": "note",
                },
                ExpressionAttributeValues: {
                    ":at": data.author,
                    ":pn": data.publisherName,
                    ":sd": data.salesDate,
                    ":t": data.title,
                    ":tk": data.titleKana,
                    ":rf": data.readFlag || false,
                    ":note": data.note || "",
                }
            });
            const updateResult = await docClient.send(command);
            console.log(updateResult);
        } else {
            // シーケンス番号の取得
            const seqNo = await getNextSeq("Books", userName);
            console.log("next seq => ", seqNo);

            // DynamoDBへの登録
            const command = new PutCommand({
                TableName: "Books",
                Item: {
                    username: userName,
                    seqno: seqNo,
                    author: data.author,
                    isbn: data.isbn,
                    publisherName: data.publisherName,
                    salesDate: data.salesDate,
                    title: data.title,
                    titleKana: data.titleKana,
                    readFlag: data.readFlag || false,
                    note: data.note || "",
                }
            });
            const putResult = await docClient.send(command);
            console.log(putResult);
        }
        
        response = createResponse(200, { message: "OK" });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
