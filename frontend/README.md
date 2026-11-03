# ツンドク.com フロントエンド

React + TypeScript の SPA です。ビルドツールは Vite、UI は Tailwind CSS と shadcn/ui を使っています。
システム全体の仕様は、リポジトリ直下の `SPECIFICATIONS.md` を参照してください。

## 準備

`src/config.json`（git では追跡されません）が必要です。次の 3 つの値を入れてください。

```json
{
  "CognitoUserPoolId": "<ユーザープールID>",
  "CognitoClientId": "<アプリクライアントID>",
  "ApiEndpoint": "<API Gateway の URL（末尾のスラッシュなし）>"
}
```

## スクリプト

`frontend` ディレクトリで実行します。

| コマンド | 内容 |
|---|---|
| `npm start`（または `npm run dev`） | 開発サーバーを起動します（<http://localhost:3000>）。 |
| `npm run build` | 型チェック（`tsc --noEmit`）のあと、本番用にビルドして `build/` に出力します。この `build/` の中身を、GitHub Actions（`.github/workflows/deploy-frontend.yml`）が S3 に配置します。 |
| `npm run preview` | ビルドした `build/` を、ローカルで確認します。 |

## 構成

| 場所 | 内容 |
|---|---|
| `src/components/` | 画面と部品。`ui/` は shadcn/ui の部品です。 |
| `src/lib/` | 同意 API や書影の取得など、画面に依存しない処理です。 |
| `src/index.css` | 配色（CSS 変数）と、ガラス表現のユーティリティです。 |

規約（`Terms.tsx`、`PrivacyPolicy.tsx`）の本文を変更したときは、バックエンドの規約バージョンも更新する必要があります。手順は `SPECIFICATIONS.md` の「利用規約・プライバシーポリシーを改定するとき」を参照してください。
