import { Construct } from '@aws-cdk/core';
import { UserPool, UserPoolClient } from '@aws-cdk/aws-cognito';

/**
 * @description This Construct creates all the resources required to enable
 * oauth based authentication
 *
 *
 * We are using some of the not recommended approaches here
 * just to keep the code simple and easy to understand.
 */
export class Cognito extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // create user directory to store user and their sessions
    const userPool = new UserPool(this, 'UserPool', {
      autoVerify: {
        email: true,
      },
      signInAliases: {
        email: true,
        preferredUsername: true,
      },
      selfSignUpEnabled: true,
    });

    // create userPoolClient for our api
    new UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        // for the sake of simplicity we are only adding one auth flow
        userSrp: true,
      },
      oAuth: {
        flows: {
          // it is recommended to not use implicitCodeGrant flow in general
          // see more https://oauth.net/2/grant-types/implicit/#:~:text=It%20is%20not%20recommended%20to,been%20received%20by%20the%20client.
          implicitCodeGrant: true,
        },
        scopes: [],
        // this is where the oauth server will redirect us after successful login
        callbackUrls: ['https://www.google.com'],
      },
      preventUserExistenceErrors: true,
    });
  }
}
