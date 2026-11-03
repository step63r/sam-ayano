import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

const BUCKET_NAME = 'serverless-book-management-system';
const DOMAIN_NAME = 'sbms.minatoproject.com';
// CloudFront の証明書は us-east-1 のものしか使えない。証明書は DNS 検証で別管理のため、ARN で参照するだけにする
const CERTIFICATE_ARN =
  'arn:aws:acm:us-east-1:966191971257:certificate/02754811-e993-4304-bcb6-56f437d2d0e5';
// マネージドポリシー Managed-CachingOptimized
const CACHING_OPTIMIZED_POLICY_ID = '658327ea-f89d-4fab-a63d-7e88639e58f6';

/**
 * コンソールで作成済みのフロントエンド配信リソースを、そのまま CDK の管理下に置くためのスタック。
 *
 * `cdk import` で既存リソースを取り込む前提のため、プロパティは現行の設定と 1 対 1 で一致させる必要がある。
 * L2 コンストラクトは Origin ID の採番やポリシー文書を独自に生成して差分が出るので、L1 を使っている。
 * 取り込みが済んで差分が出ないことを確認できたら、必要に応じて L2 へ置き換える。
 *
 * 論理 ID は import のマッピングと対応させるため固定している。
 * 誤ってスタックを削除しても配信が止まらないよう、すべて Retain にしている。
 */
export class HostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.CfnBucket(this, 'Bucket', {
      bucketName: BUCKET_NAME,
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          {
            bucketKeyEnabled: true,
            serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
          },
        ],
      },
      ownershipControls: {
        rules: [{ objectOwnership: 'BucketOwnerEnforced' }],
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    });

    const originAccessControl = new cloudfront.CfnOriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlConfig: {
        name: 'sbms-OAC',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    const originId = `${BUCKET_NAME}.s3.${this.region}.amazonaws.com`;

    const distribution = new cloudfront.CfnDistribution(this, 'Distribution', {
      distributionConfig: {
        enabled: true,
        aliases: [DOMAIN_NAME],
        defaultRootObject: 'index.html',
        httpVersion: 'http2',
        ipv6Enabled: true,
        priceClass: 'PriceClass_All',
        comment: '',
        origins: [
          {
            id: originId,
            domainName: bucket.attrRegionalDomainName,
            originAccessControlId: originAccessControl.attrId,
            // OAC を使う場合も S3OriginConfig は必須で、OAI は空にする
            s3OriginConfig: { originAccessIdentity: '' },
            connectionAttempts: 3,
            connectionTimeout: 10,
            originPath: '',
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: originId,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          cachePolicyId: CACHING_OPTIMIZED_POLICY_ID,
          compress: true,
          smoothStreaming: false,
        },
        // 非公開バケットは、存在しないキーに 403 を返す。SPA のルーティングのため、index.html を返して 200 にする
        customErrorResponses: [
          {
            errorCode: 403,
            responsePagePath: '/',
            responseCode: 200,
            errorCachingMinTtl: 0,
          },
        ],
        viewerCertificate: {
          acmCertificateArn: CERTIFICATE_ARN,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        },
        restrictions: { geoRestriction: { restrictionType: 'none' } },
      },
      tags: [{ key: 'Name', value: 'ツンドク.com' }],
    });

    const bucketPolicy = new s3.CfnBucketPolicy(this, 'BucketPolicy', {
      bucket: bucket.ref,
      policyDocument: {
        // 現行のポリシー文書に合わせて、古い Version と Id を維持している
        Version: '2008-10-17',
        Id: 'PolicyForCloudFrontPrivateContent',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Action: 's3:GetObject',
            Resource: `${bucket.attrArn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': `arn:${this.partition}:cloudfront::${this.account}:distribution/${distribution.ref}`,
              },
            },
          },
        ],
      },
    });

    // CloudFormation の import は、取り込む全リソースに DeletionPolicy の指定を求める
    for (const resource of [bucket, originAccessControl, distribution, bucketPolicy]) {
      resource.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
      resource.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;
    }

    bucket.overrideLogicalId('Bucket');
    originAccessControl.overrideLogicalId('OriginAccessControl');
    distribution.overrideLogicalId('Distribution');
    bucketPolicy.overrideLogicalId('BucketPolicy');
  }
}
