# ツンドク.com

## Description

本のバーコードを読み取るだけで登録可能な、シンプルな書籍管理サービスです。

続き物のマンガや小説など、同じ巻を重複して買うことを防止できます。

## Requirement

- Visual Studio Code
  - AWS Toolkit
- Node.js v22.14.0
- Amazon Web Services
  - CloudFront
  - S3
  - API Gateway
  - Lambda
  - DynamoDB

## Install

このリポジトリをフォークしてクローンします。

```
$ git clone git@github.com:yourname/sam-ayano.git
```

## Usage

`master` にプッシュすると、GitHub Actions が変更のあった側を自動でデプロイします。

- フロントエンド: ビルドして S3 に配置し、CloudFront のキャッシュを削除します
- バックエンド: SAM アプリケーションとしてデプロイします

初回のセットアップ（IAM ロールの作成と GitHub への値の登録）は、`SPECIFICATIONS.md` の「10.3 GitHub Actions のための AWS 設定」を参照してください。

## Deploy Flow

```mermaid
flowchart TB
  Dev(["git push master"])

  subgraph BE["バックエンド: lambda-nodejs22.x/** の変更時"]
    BA["GitHub Actions<br/>deploy-backend"]
    BO["OIDC ロールで AWS 認証"]
    BB["sam build"]
    BD["sam deploy<br/>楽天APIの secrets を parameter-overrides で渡す"]
    BC["CloudFormation<br/>stack-sam-ayano"]
    BR["API Gateway / Lambda / DynamoDB"]
    BA --> BO --> BB --> BD --> BC --> BR
  end

  subgraph FE["フロントエンド: frontend/** の変更時"]
    FA["GitHub Actions<br/>deploy-frontend"]
    FB["npm ci → config.json 生成 → npm run build"]
    FO["OIDC ロールで AWS 認証"]
    FS1["s3 sync assets/<br/>長期キャッシュ・--delete なし"]
    FS2["s3 sync その他<br/>no-cache・--delete"]
    FI["CloudFront invalidation /*"]
    FA --> FB --> FO --> FS1 --> FS2 --> FI
  end

  subgraph INIT["初期構築のみ・手動"]
    OIDC["github-oidc.yaml<br/>OIDC ロール作成"]
    CDK["CDK hosting-sam-ayano<br/>S3 / CloudFront 定義"]
  end

  Dev --> BA
  Dev --> FA
  OIDC -.-> BO
  OIDC -.-> FO
  CDK -.-> FS2
```

## Contribution

1. このリポジトリをフォークする
2. 変更を加える
3. 変更をコミットする
4. ブランチにプッシュする
5. プルリクエストを作成する

## License

MIT License

## Author

[minato](https://www.minatoproject.com/)
