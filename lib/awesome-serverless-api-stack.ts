import * as cdk from '@aws-cdk/core';
import { ApiConstruct } from './api.construct';

export class AwesomeServerlessApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ApiConstruct(this, 'ApiConstruct');
  }
}
