import { getUserName } from "./auth.mjs";

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
 * @param {object} store DynamoDB への問い合わせ
 * @param {*} tableName テーブル名
 * @returns シーケンス番号
 */
const getNextSeq = async (store, tableName) => {
    const input = {
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
    };

    const response = await store.update(input);
    console.log(response);

    return response.Attributes.value;
}

/**
 * ハンドラーを生成する。DynamoDB を呼ぶ部分を外から渡せるようにしているのは、SDK なしでテストするため
 * @param {object} deps 依存
 * @param {object} deps.store DynamoDB への問い合わせ（query / update / put。引数は DynamoDB の各コマンドの入力）
 * @param {() => number} [deps.now] 現在時刻（エポックミリ秒）の取得関数
 */
export const createHandler = ({ store, now = () => Date.now() }) => async (event, context) => {
    console.log("event", event);
    // 貸し出す側は、必ず認証済みのユーザー自身。借りる側は会員証QRから読み取った値なので、本文から受け取る
    const lender_username = getUserName(event);
    if (!lender_username) {
        return createResponse(401, { message: "認証情報を取得できませんでした" });
    }
    const { renter_username, renter_email, isbn } = JSON.parse(event.body);

    let response = {};

    try {
        // DynamoDBから書籍情報を取得
        const queryInput = {
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
        };
        const queryResult = await store.query(queryInput);
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
        const seqNo = await getNextSeq(store, "RentalBook");
        console.log("next seq =>", seqNo);
        
        // DynamoDBへの登録
        const putInput = {
            TableName: "RentalBook",
            Item: {
                rental_id: seqNo,
                lender_username: lender_username,
                renter_username: renter_username,
                // renter_username は変更されない sub なので、画面表示用に貸出時点のメールアドレスを控える
                ...(typeof renter_email === "string" && renter_email !== "" ? { renter_email } : {}),
                isbn: isbn,
                seqno: item.seqno,
                rental_date: now(),
                return_flag: false,
            }
        };
        const putResult = await store.put(putInput);
        console.log(putResult);

        // 書籍の貸出フラグを更新
        const updateInput = {
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
        };
        const updateResult = await store.update(updateInput);
        console.log(updateResult);

        response = createResponse(200, { message: "OK" });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
