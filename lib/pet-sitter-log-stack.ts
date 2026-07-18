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
      bundling: { externalModules: ['@aws-sdk/*'] }, // bundle the AWS SDK so the function is self-contained
    });
    table.grantWriteData(createPet);

    const api = new HttpApi(this, 'PetSitterApi');
    api.addRoutes({
      path: '/pets',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreatePetIntegration', createPet),
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}
