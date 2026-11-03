import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
    get: (input) => docClient.send(new GetCommand(input)),
    query: (input) => docClient.send(new QueryCommand(input)),
};

export const lambdaHandler = createHandler({ store });
