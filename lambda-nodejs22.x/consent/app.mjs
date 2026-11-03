import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./handler.mjs";

const dynamodbClient = new DynamoDBClient({
    region: 'ap-northeast-1',
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

/** 同意記録テーブル名。template.yaml の ConsentTable から環境変数で渡される */
const tableName = process.env.CONSENT_TABLE_NAME;

/**
 * DynamoDB を使った同意記録の保存先
 */
const store = {
    /**
     * 指定バージョンへの同意記録を取得する
     * @param {string} userId ユーザーID
     * @param {string} termsVersion 規約バージョン
     * @returns 同意記録。無ければ undefined
     */
    getAgreement: async (userId, termsVersion) => {
        const result = await docClient.send(new GetCommand({
            TableName: tableName,
            Key: { userId: userId, termsVersion: termsVersion },
            // 同意直後の再取得で、古い「未同意」が返らないようにする
            ConsistentRead: true,
        }));
        return result.Item;
    },

    /**
     * 同意記録が無い場合だけ保存する
     * @param {object} item 同意記録
     * @returns 新規に保存したら true、すでに存在したら false
     */
    putAgreementIfAbsent: async (item) => {
        try {
            await docClient.send(new PutCommand({
                TableName: tableName,
                Item: item,
                ConditionExpression: "attribute_not_exists(userId)",
            }));
            return true;
        } catch (error) {
            if (error?.name === "ConditionalCheckFailedException") {
                return false;
            }
            throw error;
        }
    },
};

export const lambdaHandler = createHandler({ store });
