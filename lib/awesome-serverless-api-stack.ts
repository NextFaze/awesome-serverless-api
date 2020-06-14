import * as cdk from '@aws-cdk/core';
import { Cognito } from './cognito.construct';
import { ApiConstruct } from './api.construct';

export class AwesomeServerlessApiStack extends cdk.Stack {
  // Apply default config here
  config = { hostedAuthDomainPrefix: 'my-auth-1591780305' };

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cognitoResources = new Cognito(this, 'Cognito', {
      hostedAuthDomainPrefix: this.config.hostedAuthDomainPrefix,
    });
    new ApiConstruct(this, 'ApiConstruct', {
      userPool: cognitoResources.userPool,
    });
  }
}
