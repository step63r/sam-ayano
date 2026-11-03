# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ツンドク.com: 本のバーコードを読み取って登録する蔵書管理サービス。React SPA + AWS サーバーレス（API Gateway / Lambda / DynamoDB / Cognito / S3 + CloudFront）。
仕様の詳細は `SPECIFICATIONS.md`（日本語）にある。コード・仕様・コメントは日本語で書かれているので、それに合わせる。

## リポジトリ構成

モノレポだが、ルートに共通の `package.json` は無い。各ディレクトリが独立している。

- `frontend/` — Vite + React 19 + TypeScript + Tailwind 4 / shadcn/ui
- `lambda-nodejs22.x/` — SAM アプリ（`template.yaml`）。Lambda は 1 ディレクトリ 1 関数
- `infra/cdk/` — S3 / CloudFront の CDK スタック（既存リソースを `cdk import` で取り込み済みの前提。手順は `infra/cdk/README.md`）
- `infra/bootstrap/github-oidc.yaml` — GitHub Actions 用の OIDC ロール。人が最初に 1 回だけデプロイする
- `scripts/` — 一回限りのデータ移行スクリプト（`migrate-username-to-sub.mjs`。AWS CLI を呼び出す。dry-run が既定で、`--execute` で書き込む）

## コマンド

PowerShell 7 で実行する。

```powershell
# フロントエンド（frontend/）
npm ci
npm run dev        # Vite 開発サーバー（ポート 3000）
npm run build      # tsc --noEmit && vite build（出力先は dist ではなく build/）
```

フロントエンドにテスト・Lint のスクリプトは無い。型チェックは `npm run build` に含まれる。

```powershell
# バックエンド（lambda-nodejs22.x/）
sam build
sam deploy                                            # 楽天の認証情報が必要（下記）
sam deploy --config-file samconfig.local.toml         # 手元からデプロイする場合

# 単一関数のテスト（lambda-nodejs22.x/<関数名>/ で実行）
npm test                                              # node --test "tests/unit/**/*.test.mjs"
node --test tests/unit/handler.test.mjs               # 単一ファイルのみ
```

テストは Node 組み込みの `node:test` で、関数ごとに実行する（全関数をまとめて回すスクリプトは無い）。AWS SDK も実 DynamoDB も使わない。

CDK（`infra/cdk/`）: `npm run build`（型チェック）、`npx cdk diff hosting-sam-ayano`、`npx cdk deploy hosting-sam-ayano`。

## バックエンドの設計

- **ハンドラーは `app.mjs` と `handler.mjs` に分ける**。`app.mjs` は SDK クライアントを作り、`store`（DynamoDB コマンドの生成と送信だけ）を `createHandler({ store })` に渡す。判断ロジックはすべて `handler.mjs` にあり、テストでは `store` をモックに差し替える。新しい関数もこの形に合わせる。
- **ユーザーの特定は JWT の `sub` だけ**。`event.requestContext.authorizer.claims.sub` を使い、リクエスト本文のユーザー名は絶対に参照しない。取得できなければ 401。Books.username などデータのキーは、メールアドレスではなく `sub`。
- **`auth.mjs` は各関数のディレクトリに同一内容でコピーしている**（関数ごとに `CodeUri` が分かれているため）。変更するときは全コピーを同時に更新する（`consent` と、認証不要の `search-*` を除く 9 関数）。
- 関数の追加・変更は `template.yaml`（`CodeUri`、API イベント）にも反映する。`.vscode/launch.json` に関数ごとのデバッグ設定がある。
- 全 API は POST、Cognito オーソライザー必須。`Globals.Function.Timeout` は 3 秒。
- 書影の取得は openBD を先に、無ければ楽天Books（`update-books/cover.mjs`、`search-rakuten-book/rakuten.mjs`）。書影が取れなくても登録は止めない。
- **楽天の認証情報**（`RAKUTENAPPLICATIONID` / `RAKUTENACCESSKEY` / `RAKUTENREFERER`）は `NoEcho` のパラメーターで、git 管理下の `samconfig.toml` に書かない。手元では git 管理外の `samconfig.local.toml` を使う（`--config-file` を指定すると `samconfig.toml` は読まれないので、スタック名・リージョンも書く）。例は `SPECIFICATIONS.md` 10.2。

## フロントエンドの設計

- エントリは `src/index.tsx`。`Authenticator.Provider` → `LoadingProvider` → `AuthGate`（認証）→ `ConsentGate`（規約への同意）→ `App`（ルーティング）の順に包む。
- `src/config.json`（`CognitoUserPoolId` / `CognitoClientId` / `ApiEndpoint`）は **git 管理外**。ローカルで動かすには自分で作る。CI は repository variables から生成する。
- API 呼び出しは axios で `config.ApiEndpoint` に POST し、`fetchAuthSession()` で得たトークンを `Authorization` ヘッダーに付ける（共通のクライアント層は無く、各コンポーネントが直接呼ぶ）。
- パスエイリアス `@/*` → `src/*`。UI は `src/components/ui/`（shadcn）、見た目の「Liquid Glass」は `src/index.css` の CSS 変数とユーティリティで統一する。
- Amplify UI の CSS は Tailwind を打ち消さないよう、専用レイヤー `amplify` に入れて読み込む。

## 規約（利用規約・プライバシーポリシー）を改定するとき

本文を実質的に変えたら、`frontend/src/components/Terms.tsx` / `PrivacyPolicy.tsx` の本文に加えて、`lambda-nodejs22.x/consent/handler.mjs` の `CURRENT_TERMS_VERSION` も更新する。更新しないと既存ユーザーに再同意を求められない。デプロイは**バックエンドを先、フロントエンドを後**にする。詳細は `SPECIFICATIONS.md` 11.4。

## デプロイ

`master` への push で GitHub Actions が、変更のあった側だけを自動デプロイする（`.github/workflows/deploy-frontend.yml` / `deploy-backend.yml`）。AWS へは OIDC のロールで認証する。

- フロントエンド: `frontend/` の変更で、ビルド → S3 同期 → CloudFront のキャッシュ削除。`assets/` は長期キャッシュ、それ以外は `no-cache`
- バックエンド: `lambda-nodejs22.x/` の変更で `sam build` → `sam deploy`

初回の AWS / GitHub 設定は `SPECIFICATIONS.md` 10.3 を参照。
