# ツンドク.com システム仕様書

## 1. システム概要

### 1.1 システム名
ツンドク.com (β版)

### 1.2 システム目的
本のバーコードを読み取るだけで登録可能な、シンプルな書籍管理サービス。  
続き物のマンガや小説など、同じ巻を重複して買うことを防止する。

### 1.3 システム構成
- **フロントエンド**: React SPA (Single Page Application)
- **バックエンド**: AWS Lambda + API Gateway (Serverless Architecture)
- **データベース**: Amazon DynamoDB
- **認証**: Amazon Cognito
- **配信**: Amazon CloudFront + S3

## 2. 技術仕様

### 2.1 フロントエンド技術スタック
- **フレームワーク**: React 19.0.0 with TypeScript 4.9.5
- **UIライブラリ**: Material-UI 6.4.6
- **ルーティング**: React Router 6.x
- **認証**: AWS Amplify UI React 6.9.2
- **バーコード読取**: @yudiel/react-qr-scanner 2.1.0
- **ビルドツール**: React Scripts 5.0.1
- **状態管理**: React Context API

### 2.2 バックエンド技術スタック
- **ランタイム**: Node.js 22.x
- **フレームワーク**: AWS SAM (Serverless Application Model)
- **API**: REST API (JSON)
- **認証**: Amazon Cognito JWT Token
- **外部API**: 楽天Books API, openBD API

### 2.3 インフラストラクチャ
- **コンピューティング**: AWS Lambda
- **API管理**: Amazon API Gateway
- **データベース**: Amazon DynamoDB
- **認証**: Amazon Cognito User Pool
- **ストレージ**: Amazon S3
- **CDN**: Amazon CloudFront
- **リージョン**: ap-northeast-1 (東京)

## 3. 機能仕様

### 3.1 画面一覧
| 画面名 | パス | 説明 |
|--------|------|------|
| ホーム画面 | `/` | メニュー画面 |
| バーコード読取画面 | `/readBarcode` | カメラでバーコードを読み取り |
| ISBN/JAN入力画面 | `/inputIsbnJan` | 手動でISBN/JANを入力 |
| 書籍詳細画面 | `/book` | 書籍情報の確認・編集 |
| 書籍一覧画面 | `/books` | 登録済み書籍の一覧表示 |
| 書籍更新画面 | `/books/:seqno` | 登録済み書籍の編集 |
| 更新完了画面 | `/updateComplete` | 更新処理完了通知 |
| 会員証画面 | `/membership` | 会員証QRコードの表示 |
| 設定画面 | `/settings` | アカウント設定メニュー |
| パスワード変更画面 | `/settings/changePassword` | パスワード変更 |
| ユーザー削除画面 | `/settings/deleteUser` | アカウント削除 |
| 利用規約画面 | `/terms` | 利用規約表示 |
| プライバシーポリシー画面 | `/privacyPolicy` | プライバシーポリシー表示 |

### 3.2 主要機能

#### 3.2.1 書籍登録機能
- **バーコード読取**: カメラを使用してバーコード（ISBN/JAN）を自動読取
- **手動入力**: ISBN/JANコードの手動入力
- **重複チェック**: 既存書籍との重複を自動検出
- **書籍情報取得**: openBD API・楽天Books APIから書籍情報を自動取得
- **情報編集**: タイトル、著者、出版社、発売日の手動編集
- **読書管理**: 読んだフラグ、感想の登録

#### 3.2.2 書籍一覧・検索機能
- **一覧表示**: 登録済み書籍の一覧表示
- **無限スクロール**: IntersectionObserver APIを使用したページング
- **検索機能**: タイトル、著者、出版社での部分一致検索
- **ソート機能**: 登録順、タイトル順、発売日順（昇順・降順）
- **フィルタ機能**: 未読書籍のみ表示
- **状態保持**: 検索条件、ソート順、フィルタ状態のlocalStorage保存

#### 3.2.3 書籍管理機能
- **詳細表示**: 書籍情報の詳細表示
- **情報更新**: 書籍情報の編集・更新
- **削除機能**: 書籍の削除
- **読書記録**: 読了フラグの切り替え、感想の記録

#### 3.2.4 認証・アカウント管理
- **ユーザー登録**: AWS Amplify の `Authenticator` によるサインアップ。登録画面に利用規約・プライバシーポリシーの本文を表示し、同意のチェックを入れないと登録できない
- **ログイン**: AWS Cognito認証（画面の見た目は `AuthGate` で差し替え、認証の処理は Amplify の `Authenticator` を使う）
- **規約への同意・再同意**: ログイン後、現在の規約バージョンに同意していないユーザーには、同意するまで本体の画面を表示せず、同意画面（`ConsentGate` / `ConsentPage`）を出す。規約を改定してバージョンを更新すると、既存の全ユーザーに再同意を求められる。同意状況の取得に失敗した場合は、全員がログインできなくなるのを避けるため、利用を許可する（次回のログインで再確認される）
  - 新規登録画面で同意したユーザーには、初回ログイン直後に同じ同意を再度求めない。登録直後は未認証で同意を記録できないため、登録成功時にメールアドレスと時刻を `localStorage`（`tsundoku.signupConsent`）に控え、初回ログイン時に自動で記録する。控えの有効期間は 24 時間（Cognito の確認コードの有効期間に合わせている）
- **パスワード変更**: AWS Amplify UI によるパスワード変更
- **アカウント削除**: ユーザーアカウントの完全削除

## 4. データベース設計

### 4.1 DynamoDB テーブル構造

#### 4.1.1 Books テーブル
**プライマリキー**
- **パーティションキー**: `username` (String) - ユーザー名
- **ソートキー**: `seqno` (Number) - 書籍シーケンス番号

**属性**
| 属性名 | 型 | 説明 |
|--------|----|----|
| username | String | ユーザー名（Cognitoログインユーザー名） |
| seqno | Number | 書籍シーケンス番号（ユーザー内でのユニークな連番） |
| author | String | 著者名 |
| isbn | String | ISBN/JANコード |
| publisherName | String | 出版社名 |
| salesDate | String | 発売日（YYYY-MM-DD形式） |
| title | String | 書籍タイトル |
| titleKana | String | 書籍タイトル（カナ） |
| readFlag | Boolean | 読了フラグ（true: 読了、false: 未読） |
| note | String | 感想・メモ |

**グローバルセカンダリインデックス（GSI）**
- **isbn-index**: isbn をキーとするインデックス
- **title-index**: username + title をキーとするソートインデックス
- **titleKana-index**: username + titleKana をキーとするソートインデックス
- **salesDate-index**: username + salesDate をキーとするソートインデックス

#### 4.1.2 ConsentTable テーブル（規約への同意記録）
`template.yaml` で作成する（`sam deploy` で作成され、手動作成は不要）。同意の履歴（いつ・どの版に同意したか）をすべて残すため、1 ユーザーにつき規約バージョンごとに 1 行を持つ。法的な証跡になるため、スタックを削除・置換しても消えないよう `DeletionPolicy: Retain` を指定し、ポイントインタイムリカバリを有効にしている。

**プライマリキー**
- **パーティションキー**: `userId` (String) - Cognito の `sub`（JWT から取得）
- **ソートキー**: `termsVersion` (String) - 規約バージョン（改定日、例: `2026-11-03`）

**属性**
| 属性名 | 型 | 説明 |
|--------|----|----|
| userId | String | ユーザーID（Cognito の `sub`） |
| termsVersion | String | 同意した規約バージョン |
| agreedAt | String | 同意した日時（ISO 8601）。同意済みの行は上書きしないため、最初の同意日時が残る |
| email | String | 同意時のメールアドレス（JWT の値。無い場合は保存しない） |

## 5. API仕様

### 5.1 エンドポイント一覧
| メソッド | エンドポイント | 説明 |
|----------|----------------|------|
| POST | `/search-rakuten-book` | 楽天Books APIで書籍検索 |
| POST | `/search-openbd` | openBD APIで書籍検索 |
| POST | `/check-exists` | 書籍の重複チェック |
| POST | `/update-books` | 書籍情報の登録・更新 |
| POST | `/get-books` | 書籍一覧の取得 |
| POST | `/get-book` | 単一書籍の詳細取得 |
| POST | `/get-books-count` | 登録書籍数の取得 |
| POST | `/delete-book` | 書籍の削除 |
| POST | `/get-consent-status` | 現在の規約バージョンへの同意状況の取得 |
| POST | `/record-consent` | 現在の規約バージョンへの同意の記録 |

### 5.2 認証
すべてのAPIエンドポイントは Amazon Cognito JWT Token による認証が必要。

### 5.3 主要API詳細

#### 5.3.1 書籍一覧取得 API
**エンドポイント**: `POST /get-books`

**リクエストパラメータ**
```json
{
  "userName": "string",
  "pageSize": "number",
  "lastEvaluatedKey": "object",
  "keyword": "string",
  "sortKeyId": "number",
  "desc": "boolean",
  "unreadFlag": "boolean"
}
```

**レスポンス**
```json
{
  "items": [
    {
      "seqno": "number",
      "author": "string",
      "publisherName": "string",
      "title": "string"
    }
  ],
  "lastEvaluatedKey": "object"
}
```

#### 5.3.2 規約への同意 API
**エンドポイント**: `POST /get-consent-status`、`POST /record-consent`（どちらも同じ Lambda `consent` が処理する）

**リクエスト**: 本文は不要（送られても参照しない）。ユーザーは認証トークン（JWT）の `sub` から特定する。他の API のように、本文の `userName` は使わない。

**レスポンス**（2 つの API で共通）
```json
{
  "currentVersion": "2026-11-03",
  "mustAgree": true,
  "agreedAt": "2026-11-04T01:02:03.000Z"
}
```
- `currentVersion`: サーバー側で管理する現在の規約バージョン（`lambda-nodejs22.x/consent/handler.mjs` の `CURRENT_TERMS_VERSION`）
- `mustAgree`: 現在のバージョンへの同意が必要か。そのバージョンの同意記録が無ければ `true`
- `agreedAt`: 現在のバージョンに同意した日時。未同意の場合は含まれない

`/record-consent` は、バージョンをリクエストから受け取らず、常にサーバー側の現在のバージョンで記録する。すでに同意済みの場合は何もせず、最初の同意日時を返す（二重送信や再試行で、同意日時が上書きされない）。

## 6. UI/UX仕様

### 6.1 レスポンシブデザイン
- **ブレークポイント**: Material-UI標準ブレークポイントを使用
  - xs: 0px以上（スマートフォン）
  - sm: 576px以上（タブレット小）
  - md: 768px以上（タブレット大）
  - lg: 992px以上（デスクトップ）
  - xl: 1200px以上（大型デスクトップ）

### 6.2 マージン設計
- **ResponsiveLayoutコンポーネント**による統一マージン
  - xs: 16px, sm: 24px, md: 32px, lg: 64px, xl: 96px

### 6.3 ナビゲーション
- **PageHeaderコンポーネント**による統一ヘッダー
- **自動スクロールリセット**: 画面遷移時に自動的にページトップへスクロール
- **戻るボタン**: モバイル画面でのみ表示（md未満）

### 6.4 状態管理
- **LoadingContext**: 全画面共通のローディング状態管理
- **localStorage**: ユーザー設定の永続化
  - ソート設定（`books_sort_settings`）
  - 未読フィルタ設定（`books_unread_filter`）
  - 検索キーワード（`books_search_keyword`）

## 7. セキュリティ仕様

### 7.1 認証・認可
- **AWS Cognito User Pool**による認証
- **JWT Token**による API アクセス制御
- **ユーザー単位のデータ分離**: usernameによるマルチテナント設計

### 7.2 API セキュリティ
- **CORS設定**: 適切なオリジン制限
- **HTTPSのみ**: すべての通信はHTTPS暗号化
- **レート制限**: API Gateway によるスロットリング

### 7.3 データ保護
- **DynamoDB暗号化**: 保存時暗号化有効
- **個人情報の最小化**: 必要最小限の個人情報のみ保存

## 8. パフォーマンス仕様

### 8.1 フロントエンド
- **コード分割**: React.lazy による遅延ローディング
- **無限スクロール**: 効率的なデータ読み込み（PAGE_SIZE: 10件）
- **重複除去**: クライアント側での重複データフィルタリング
- **デバウンス**: 検索入力の500ms デバウンス処理

### 8.2 バックエンド
- **Lambda冷却時間**: 最大3秒のタイムアウト設定
- **DynamoDB最適化**: 適切なGSI設計によるクエリ効率化
- **ページング**: LastEvaluatedKey による効率的なページング

## 9. 監視・ログ仕様

### 9.1 ログ設定
- **API Gateway**: INFO レベルログ、データトレース有効
- **Lambda**: CloudWatch Logs による詳細ログ
- **エラーハンドリング**: 適切なエラーレスポンスとログ出力

### 9.2 メトリクス
- **API Gateway**: メトリクス有効化
- **Lambda**: 実行時間、エラー率の監視
- **DynamoDB**: 読み取り/書き込み容量の監視

## 10. デプロイメント仕様

### 10.1 フロントエンド
- **ビルド**: `npm run build`
- **配置先**: Amazon S3 バケット
- **配信**: CloudFront による CDN 配信

### 10.2 バックエンド
- **デプロイツール**: AWS SAM CLI
- **設定ファイル**: `template.yaml`
- **環境変数**: `RAKUTEN_APPLICATION_ID` (楽天APIキー)

### 10.3 必要なAWSリソース
- CloudFront Distribution
- S3 Bucket (静的サイトホスティング)
- API Gateway
- Lambda Functions (8個)
- DynamoDB Table (Books)
- Cognito User Pool
- IAM Roles and Policies

## 11. 開発・運用仕様

### 11.1 開発環境要件
- Node.js v22.14.0
- Visual Studio Code + AWS Toolkit
- Git (リポジトリ管理)

### 11.2 外部サービス依存
- **openBD API**: 書籍情報取得の第一選択肢
- **楽天Books API**: openBD APIで見つからない場合のフォールバック

### 11.3 ライセンス
MIT License

### 11.4 利用規約・プライバシーポリシーを改定するとき
規約の本文を実質的に変更した場合は、**必ず次の 3 つを行う**。バージョンを更新しないと、既存ユーザーに再同意を求められない。

1. 本文を変更する（`frontend/src/components/Terms.tsx` の `TermsContent`、`PrivacyPolicy.tsx` の `PrivacyPolicyContent`）。新規登録画面・同意画面・各ページは、同じ本文を表示する。
2. `lambda-nodejs22.x/consent/handler.mjs` の `CURRENT_TERMS_VERSION` を、改定日（`YYYY-MM-DD`）に更新する。
3. **バックエンド（`sam build && sam deploy`）を先に、フロントエンドを後に**デプロイする。順序が逆だと、同意状況の取得に失敗する間は、利用が許可される（再同意が求められない）。

誤字の修正など、意味を変えない変更では、バージョンを更新しなくてよい（更新すると、全ユーザーに不要な再同意を求めることになる）。

`CURRENT_TERMS_VERSION` を更新してデプロイすると、既存の全ユーザーが、次回の画面表示時（ログイン中のユーザーは、画面を再読み込みしたとき）に同意画面へ誘導される。

---

**最終更新**: 2025年11月16日  
**バージョン**: β版  
**作成者**: minato (https://www.minatoproject.com/)
