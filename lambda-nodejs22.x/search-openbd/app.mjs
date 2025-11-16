import axios from "axios";

const baseUrl = "https://api.openbd.jp/v1/get";

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
    const { isbnjan } = JSON.parse(event.body);
    console.log("isbnjan", isbnjan);
    
    let response = {};

    const url = `${baseUrl}?isbn=${isbnjan}`;

    try {
        await axios.get(url)
            .then(r => {
                console.log("response", r);
                if (r.data.length == 1) {
                    // カナから半角スペースと全角スペースをすべて除去する
                    let titleKana = r.data[0]?.onix.DescriptiveDetail?.TitleDetail?.TitleElement?.TitleText?.collationkey;
                    if (titleKana) {
                        titleKana = titleKana.replace(/　/g, "").replace(/ /g, "");
                        r.data[0].onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.collationkey = titleKana;
                    }
                    response = createResponse(200, r.data[0]);
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
