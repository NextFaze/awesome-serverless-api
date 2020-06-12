import { Construct } from '@aws-cdk/core';
import { resolve } from 'path';
import {
  LambdaRestApi,
  ApiKeySourceType,
  AuthorizationType,
  Authorizer,
} from '@aws-cdk/aws-apigateway';
import { Function, Code, Runtime, LayerVersion } from '@aws-cdk/aws-lambda';

export class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // pack all external deps in layer
    const lambdaLayer = new LayerVersion(this, 'HandlerLayer', {
      code: Code.fromAsset(resolve(__dirname, '../api/node_modules')),
      compatibleRuntimes: [Runtime.NODEJS_12_X, Runtime.NODEJS_10_X],
      description: 'Api Handler Dependencies',
    });

    // add handler to respond to all our api requests
    const handler = new Function(this, 'Handler', {
      code: Code.fromAsset(resolve(__dirname, '../api'), {
        exclude: ['node_modules'],
      }),
      handler: 'src/main.api',
      runtime: Runtime.NODEJS_12_X,
      layers: [lambdaLayer],
    });

    // add api resource to handle all http traffic and pass it to our handler
    const lambdaRestAPi = new LambdaRestApi(this, 'LambdaRestApi', {
      handler,
      deploy: true,
      apiKeySourceType: ApiKeySourceType.HEADER,
      defaultMethodOptions: {
        apiKeyRequired: true,
        // we have enabled cognito authorizer to perform authentication for all incoming requests
        authorizationType: AuthorizationType.COGNITO,
        // WIP: add cognito
        // authorizer: cognitoAuthorizer,
      },
      deployOptions: {
        stageName: 'v1',
      },
    });

    // add api key to enable monitoring
    const apiKey = lambdaRestAPi.addApiKey('ApiKey');
    lambdaRestAPi.addUsagePlan('UsagePlan', {
      apiKey,
    });
  }
}
