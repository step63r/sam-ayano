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

フロントエンドはビルドしてS3に配置します。

```
$ npm run build
```

バックエンドはSAMアプリケーションとしてデプロイします。

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
