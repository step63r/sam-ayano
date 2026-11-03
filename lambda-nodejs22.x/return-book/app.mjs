import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./handler.mjs";

const dynamodbClient = new DynamoDBClient({
    region: 'ap-northeast-1',
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

/**
 * DynamoDB を使った貸出記録と書籍の保存先
 */
const store = {
    /**
     * 貸出記録を返却済みにする。貸出者が一致し、まだ返却されていない場合だけ更新する
     * @param {number} rentalId 貸出ID
     * @param {string} lenderUsername 貸出者のユーザー名
     * @param {number} returnDate 返却日時（エポックミリ秒）
     * @returns 更新後の貸出記録。条件に合わなければ undefined
     */
    markRentalReturned: async (rentalId, lenderUsername, returnDate) => {
        try {
            const result = await docClient.send(new UpdateCommand({
                TableName: "RentalBook",
                Key: {
                    rental_id: rentalId,
                },
                // attribute_exists がないと、存在しない貸出IDで不完全な項目が作られてしまう。
                // 返却済みを除くのは、二重返却で別の貸出の lendFlag を戻さないため
                ConditionExpression: "attribute_exists(rental_id) AND #lun = :lun AND #rf = :false",
                UpdateExpression: "set #rf = :true, #rd = :rd",
                ExpressionAttributeNames: {
                    "#lun": "lender_username",
                    "#rf": "return_flag",
                    "#rd": "return_date",
                },
                ExpressionAttributeValues: {
                    ":lun": lenderUsername,
                    ":true": true,
                    ":false": false,
                    ":rd": returnDate,
                },
                ReturnValues: "ALL_NEW",
            }));
            return result.Attributes;
        } catch (error) {
            if (error?.name === "ConditionalCheckFailedException") {
                return undefined;
            }
            throw error;
        }
    },

    /**
     * 書籍の貸出フラグを false に戻す
     * @param {string} username 書籍の所有者のユーザー名
     * @param {number} seqno 書籍のシーケンス番号
     */
    markBookReturned: async (username, seqno) => {
        await docClient.send(new UpdateCommand({
            TableName: "Books",
            Key: {
                username: username,
                seqno: seqno,
            },
            UpdateExpression: "set #lf = :false",
            ExpressionAttributeNames: {
                "#lf": "lendFlag",
            },
            ExpressionAttributeValues: {
                ":false": false,
            },
        }));
    },
};

export const lambdaHandler = createHandler({ store });
