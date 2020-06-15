import { Construct } from '@aws-cdk/core';
import { resolve } from 'path';
import {
  AuthorizationType,
  CfnAuthorizer,
  CfnMethod,
  RestApi,
  LambdaIntegration,
} from '@aws-cdk/aws-apigateway';
import { Function, Code, Runtime, LayerVersion } from '@aws-cdk/aws-lambda';
import { IUserPool } from '@aws-cdk/aws-cognito';

export interface ApiConstructProps {
  userPool: IUserPool;
}

export class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, { userPool }: ApiConstructProps) {
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
    const api = new RestApi(this, 'Api', {
      deploy: true,
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
      deployOptions: {
        stageName: 'v1',
      },
    });

    // add proxy resource to handle all api requests
    const apiResource = api.root.addProxy({
      defaultIntegration: new LambdaIntegration(handler),
      defaultMethodOptions: {
        authorizationType: AuthorizationType.COGNITO,
      },
    });

    // add api key to enable monitoring
    const apiKey = api.addApiKey('ApiKey');
    api.addUsagePlan('UsagePlan', {
      apiKey,
    });

    // add cognito authorizer
    const anyMethod = apiResource.anyMethod?.node.defaultChild as CfnMethod;
    const authorizer = new CfnAuthorizer(this, 'CognitoAuthorizer', {
      name: 'Test_Cognito_Authorizer',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
      restApiId: api.restApiId,
      type: 'COGNITO_USER_POOLS',
    });
    anyMethod.node.addDependency(authorizer);
    anyMethod.addOverride('Properties.AuthorizerId', authorizer.ref);
  }
}
