import { buildCoverOnlyUpdate, normalizeCoverUrl } from "./cover.mjs";
import { getUserName } from "./auth.mjs";


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
 * @param {object} store DynamoDB への問い合わせ
 * @param {*} tableName テーブル名
 * @param {*} userName ユーザー名
 * @returns シーケンス番号
 */
const getNextSeq = async (store, tableName, userName) => {
    const input = {
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
    };

    const response = await store.update(input);
    console.log(response);

    return response.Attributes.value;
}

/**
 * ハンドラーを生成する。DynamoDB を呼ぶ部分を外から渡せるようにしているのは、SDK なしでテストするため
 * @param {object} deps 依存
 * @param {object} deps.store DynamoDB への問い合わせ（update / put。引数は DynamoDB の各コマンドの入力）
 */
export const createHandler = ({ store }) => async (event, context) => {
    console.log("event", event);
    const userName = getUserName(event);
    if (!userName) {
        return createResponse(401, { message: "認証情報を取得できませんでした" });
    }
    const { data } = JSON.parse(event.body);

    let response = {};

    try {
        if (data.seqno && data.coverOnly) {
            // 書影だけの更新（詳細画面の「表紙を取得」）。他の項目には触れない
            const coverUrl = normalizeCoverUrl(data.coverUrl);
            if (!coverUrl) {
                return createResponse(400, { message: "書影のURLが正しくありません。" });
            }

            const coverResult = await store.update(buildCoverOnlyUpdate(userName, data.seqno, coverUrl));
            console.log(coverResult);
        } else if (data.seqno) {
            // DynamoDBへの登録
            const input = {
                TableName: "Books",
                Key: {
                    username: userName,
                    seqno: data.seqno,
                },
                // 存在しない本の行を、不完全な項目として作ってしまわないための歯止め
                ConditionExpression: "attribute_exists(seqno)",
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
            };
            const updateResult = await store.update(input);
            console.log(updateResult);
        } else {
            // シーケンス番号の取得
            const seqNo = await getNextSeq(store, "Books", userName);
            console.log("next seq => ", seqNo);

            // 書影URLは任意。検証を通らない値は保存しない。
            // 更新(上の分岐)では書影を変更しないため、登録時に保存した値がそのまま残る
            const coverUrl = normalizeCoverUrl(data.coverUrl);

            // DynamoDBへの登録
            const input = {
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
                    ...(coverUrl ? { coverUrl: coverUrl } : {}),
                }
            };
            const putResult = await store.put(input);
            console.log(putResult);
        }
        
        response = createResponse(200, { message: "OK" });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
