import * as cdk from 'aws-cdk-lib';
import { HostingStack } from '../lib/hosting-stack';

const app = new cdk.App();

new HostingStack(app, 'hosting-sam-ayano', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1' },
});
