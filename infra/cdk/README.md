# フロントエンド配信リソースの CDK

S3 バケット・CloudFront Distribution・OAC・バケットポリシーを管理する CDK アプリです。スタック名は `hosting-sam-ayano` です。
これらはコンソールで作成済みのため、新しく作るのではなく、`cdk import` で既存のものを取り込みます。

フロントエンドの中身（`index.html` など）のデプロイは、ここでは行いません。`.github/workflows/deploy-frontend.yml` の担当です。

## 既存リソースを取り込む（初回のみ）

`infra/cdk` で実行します。`import-mapping.json` は、CDK 上の論理 ID と、既存リソースの物理 ID の対応です。

```powershell
npm ci
npx cdk synth --quiet

# 1. 変更セットを作るだけで、実行はしない
npx cdk import hosting-sam-ayano --resource-mapping import-mapping.json --no-execute --change-set-name sbms-import

# 2. 変更セットの中身を確認する。4 件すべてが Import で、Add / Modify / Remove が無いこと
aws cloudformation describe-change-set --stack-name hosting-sam-ayano --change-set-name sbms-import `
  --query "Changes[].ResourceChange.[Action,LogicalResourceId,ResourceType]" --output table

# 3. 問題なければ実行する
aws cloudformation execute-change-set --stack-name hosting-sam-ayano --change-set-name sbms-import
aws cloudformation wait stack-import-complete --stack-name hosting-sam-ayano
```

取り込んだあとに、現物との差分が無いことを確認します。

```powershell
npx cdk diff hosting-sam-ayano

$id = aws cloudformation detect-stack-drift --stack-name hosting-sam-ayano --query StackDriftDetectionId --output text
aws cloudformation describe-stack-drift-detection-status --stack-drift-detection-id $id
aws cloudformation describe-stack-resource-drifts --stack-name hosting-sam-ayano `
  --stack-resource-drift-status-filters MODIFIED DELETED
```

`cdk diff` は、テンプレート同士の比較なので、現物との差分は分かりません。現物との差分は、ドリフト検出で確認します。

## 設定を変えるとき

`lib/hosting-stack.ts` を変更して、`npx cdk diff hosting-sam-ayano` で差分を確認してから、`npx cdk deploy hosting-sam-ayano` で反映します。
全リソースが Retain なので、スタックを削除してもリソースは残ります。
