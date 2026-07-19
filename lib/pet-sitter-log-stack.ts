import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProjectionType, AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {
  OpenIdConnectProvider,
  OpenIdConnectPrincipal,
  Role,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class PetSitterLogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    cdk.Tags.of(this).add('project', 'pet-sitter-log');
    cdk.Tags.of(this).add('managed-by', 'cdk');


    // Single-table design: a pet's profile and its entries share one partition
    // key (PET#<id>), so listing a pet's data is a single query.
    const table = new Table(this, 'PetSitterTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // demo data — deletes with the stack
    });

    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'shareToken', type: AttributeType.STRING },
      projectionType: ProjectionType.INCLUDE,
      // Profile fields the token view needs; PK/SK and shareToken are always indexed.
      nonKeyAttributes: ['name', 'owner', 'careNotes', 'createdAt'],
    });

    // Private bucket. Public access fully blocked — nobody hits S3 directly.
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,   // demo: tears down clean
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      // withOriginAccessControl wires OAC + the bucket policy so ONLY this
      // distribution can read the private bucket.
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      // SPA deep links: a hard refresh on /share/<token> asks S3 for a key
      // that doesn't exist → 403/404. Serve index.html so the router takes over.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });
    
    // Upload the built SPA and bust the CDN cache on every deploy.
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('web/dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    const nodeRuntime = Runtime.NODEJS_22_X;

    const createPet = new NodejsFunction(this, 'CreatePetFn', {
      entry: 'lambda/create-pet.ts',
      runtime: nodeRuntime,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] }, // Node 22 runtime already ships AWS SDK v3; no need to bundle it
    });
    table.grantWriteData(createPet);

    const createEntry = new NodejsFunction(this, 'CreateEntryFn', {
      entry: 'lambda/create-entry.ts',
      runtime: nodeRuntime,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] },
    });
    table.grantWriteData(createEntry);

    const listEntries = new NodejsFunction(this, 'ListEntriesFn', {
      entry: 'lambda/list-entries.ts',
      runtime: nodeRuntime,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] },
    });
    table.grantReadData(listEntries);

    const shareRead = new NodejsFunction(this, 'ShareReadFn', {
      entry: 'lambda/share-read.ts',
      runtime: nodeRuntime,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] },
    });
    table.grantReadData(shareRead);

    const api = new HttpApi(this, 'PetSitterApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowHeaders: ['content-type'],
      },
    });

    api.addRoutes({
      path: '/pets',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreatePetIntegration', createPet),
    });

    api.addRoutes({
      path: '/pets/{id}/entries',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreateEntryIntegration', createEntry),
    });

    api.addRoutes({
      path: '/pets/{id}/entries',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('ListEntriesIntegration', listEntries),
    });

    api.addRoutes({
      path: '/share/{token}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('ShareReadIntegration', shareRead),
    });

    // Let GitHub Actions deploy this stack with no stored AWS keys.
    // AWS trusts GitHub's OIDC provider; the role can only be assumed by
    // Actions runs from THIS repo.
    const githubOidc = new OpenIdConnectProvider(this, 'GitHubOidc', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const deployRole = new Role(this, 'GitHubDeployRole', {
      assumedBy: new OpenIdConnectPrincipal(githubOidc, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          // GitHub bakes immutable numeric IDs (owner + repo) into the OIDC
          // subject; scope to those — they survive renames and are never reused.
          'token.actions.githubusercontent.com:sub':
            'repo:johncarlobartolome-cynn@211265861/pet-sitter-log@1305060455:*',
        },
      }),
    });

    // cdk deploy works by assuming the roles `cdk bootstrap` created,
    // so this role just needs permission to assume those.
    deployRole.addToPolicy(
      new PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-hnb659fds-*-${this.account}-${this.region}`],
      }),
    );

    new cdk.CfnOutput(this, 'GitHubDeployRoleArn', { value: deployRole.roleArn });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
    new cdk.CfnOutput(this, 'SiteUrl', { value: `https://${distribution.distributionDomainName}` });
  }
}
