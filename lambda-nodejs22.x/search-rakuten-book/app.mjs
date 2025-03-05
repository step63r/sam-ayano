import axios from "axios";

const baseUrl = "https://app.rakuten.co.jp/services/api/BooksTotal/Search/20170404"

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
    const { isbnjan } = JSON.parse(event.body);
    console.log("isbnjan", isbnjan);
    
    let response = {};

    const url = `${baseUrl}?format=json&isbnjan=${isbnjan}&applicationId=${process.env.RAKUTEN_APPLICATION_ID}`;

    try {
        await axios.get(url)
            .then(r => {
                console.log("response", r);
                if (r.data.Items.length == 1) {
                    response = createResponse(200, r.data.Items[0]);
                } else {
                    response = createResponse(500, { message: "検索結果が1件ではありませんでした。" });
                }
            });
    } catch (error) {
        console.log("error", error);
        response = createResponse(500, error);
    }

    return response;
};
