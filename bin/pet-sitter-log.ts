#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PetSitterLogStack } from '../lib/pet-sitter-log-stack';

const app = new cdk.App();
new PetSitterLogStack(app, 'PetSitterLogStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-southeast-1' },
});
