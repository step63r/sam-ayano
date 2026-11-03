import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./handler.mjs";

const dynamodbClient = new DynamoDBClient({
    region: 'ap-northeast-1',
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

/**
 * DynamoDB を使った保存先。コマンドの生成と送信だけを担当し、処理の判断は handler.mjs に置く
 * （SDK なしでテストできるようにするため）
 */
const store = {
    query: (input) => docClient.send(new QueryCommand(input)),
    update: (input) => docClient.send(new UpdateCommand(input)),
    put: (input) => docClient.send(new PutCommand(input)),
};

export const lambdaHandler = createHandler({ store });
