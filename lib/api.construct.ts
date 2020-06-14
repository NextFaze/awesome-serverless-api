import { Construct } from '@aws-cdk/core';
import { resolve } from 'path';
import {
  LambdaRestApi,
  ApiKeySourceType,
  AuthorizationType,
  CfnAuthorizer,
  CfnMethod,
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

    // TODO: Add authorizer on ANY method
    // add api resource to handle all http traffic and pass it to our handler
    const lambdaRestAPi = new LambdaRestApi(this, 'LambdaRestApi', {
      handler,
      deploy: true,
      apiKeySourceType: ApiKeySourceType.HEADER,
      defaultMethodOptions: {
        apiKeyRequired: true,
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

    // add cognito authorizer
    const anyMethod = lambdaRestAPi.methods[0].node.defaultChild as CfnMethod;
    const authorizer = new CfnAuthorizer(this, 'CognitoAuthorizer', {
      name: 'Test_Cognito_Authorizer',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
      restApiId: lambdaRestAPi.restApiId,
      type: 'COGNITO_USER_POOLS',
    });
    lambdaRestAPi.methods[0].node.addDependency(authorizer);
    anyMethod.addOverride('Properties.AuthorizationType', 'COGNITO_USER_POOLS');
    anyMethod.addOverride('Properties.AuthorizerId', authorizer.ref);
  }
}
