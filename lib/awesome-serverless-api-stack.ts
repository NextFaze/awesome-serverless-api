import * as cdk from '@aws-cdk/core';
import { Cognito } from './cognito.construct';

export class AwesomeServerlessApiStack extends cdk.Stack {
  // Apply default config here
  config = { hostedAuthDomainPrefix: 'my-auth-1591780305' };

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Cognito(this, 'Cognito', {
      hostedAuthDomainPrefix: this.config.hostedAuthDomainPrefix,
    });
  }
}
