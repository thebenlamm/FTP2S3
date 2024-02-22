#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { Ftp2S3Stack } = require('../lib/ftp2_s3-stack');

const app = new cdk.App();
new Ftp2S3Stack(app, 'Ftp2S3Stack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },  
  config: {
      host: '',
      port: '22',
      username: '',
      password: '',
      layerName: '',
      layerVersion: '1',
      bucketName: ''
  }
});
