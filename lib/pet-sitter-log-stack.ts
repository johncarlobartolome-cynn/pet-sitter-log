import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class PetSitterLogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Single-table design: a pet's profile and its entries share one partition
    // key (PET#<id>), so listing a pet's data is a single query.
    const table = new Table(this, 'PetSitterTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // demo data — deletes with the stack
    });

    const createPet = new NodejsFunction(this, 'CreatePetFn', {
      entry: 'lambda/create-pet.ts',
      runtime: Runtime.NODEJS_20_X,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] }, // Node 20 runtime already ships AWS SDK v3; no need to bundle it
    });
    table.grantWriteData(createPet);

    const createEntry = new NodejsFunction(this, 'CreateEntryFn', {
      entry: 'lambda/create-entry.ts',
      runtime: Runtime.NODEJS_20_X,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] },
    });
    table.grantWriteData(createEntry);

    const listEntries = new NodejsFunction(this, 'ListEntriesFn', {
      entry: 'lambda/list-entries.ts',
      runtime: Runtime.NODEJS_20_X,
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] },
    });
    table.grantReadData(listEntries);

    const api = new HttpApi(this, 'PetSitterApi');
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

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}
