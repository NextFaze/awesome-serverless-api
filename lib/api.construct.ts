import { Construct, CfnOutput } from '@aws-cdk/core';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { resolve } from 'path';
import { LambdaRestApi, LambdaIntegration } from '@aws-cdk/aws-apigateway';
import { Function, Code, Runtime, LayerVersion } from '@aws-cdk/aws-lambda';


export class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const table = new Table(this, 'Table', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const lambdaLayer = new LayerVersion(this, 'HandlerLayer', {
      code: Code.fromAsset(resolve(__dirname, '../api/node_modules')),
      compatibleRuntimes: [Runtime.NODEJS_12_X, Runtime.NODEJS_10_X],
      description: 'Api Handler Dependencies',
    });

    const handler = new Function(this, 'Handler', {
      code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
        exclude: ['node_modules'],
      }),
      handler: 'main.api',
      runtime: Runtime.NODEJS_12_X,
      layers: [lambdaLayer],
      environment: {
        NODE_PATH: '$NODE_PATH:/opt',
        tableName: table.tableName,
      },
    });
    table.grantReadWriteData(handler);

    const api = new LambdaRestApi(this, "hello-api", {
      restApiName: 'Hello API',
      handler: handler,
      proxy: false,
    });

    api.root
      .addResource("hello")
      .addMethod("GET", new LambdaIntegration(handler));

    new CfnOutput(this, "HTTP API URL", {
      value: api.url ?? "Something went wrong with the deploy",
    });

  }
}
