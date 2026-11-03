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
 * ハンドラーを生成する。DynamoDB を呼ぶ部分を外から渡せるようにしているのは、SDK なしでテストするため
 * @param {object} deps 依存
 * @param {object} deps.store DynamoDB への問い合わせ（get / query。引数は DynamoDB の各コマンドの入力）
 */
export const createHandler = ({ store }) => async (event, context) => {
    console.log("event", event);
    const userName = getUserName(event);
    if (!userName) {
        return createResponse(401, { message: "認証情報を取得できませんでした" });
    }
    const { seqno } = JSON.parse(event.body);

    let response = {};
    let item = {};

    try {
        const input = {
            TableName: "Books",
            Key: {
                "username": userName,
                "seqno": seqno
            },
        };

        const getResult = await store.get(input);
        console.log(getResult);

        item = { ...getResult.Item };
        
        if (getResult?.Item?.lendFlag) {
            const queryInput = {
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
                ProjectionExpression: "rental_id, renter_username, renter_email, rental_date",
                Limit: 1,
            };
            const queryResult = await store.query(queryInput);
            console.log("queryResult", queryResult);
            item.rentalId = queryResult.Items[0]?.rental_id;
            item.renterUsername = queryResult.Items[0]?.renter_username || "";
            item.renterEmail = queryResult.Items[0]?.renter_email || "";
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
