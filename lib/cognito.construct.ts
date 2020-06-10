import { Construct } from '@aws-cdk/core';
import {
  UserPool,
  UserPoolClient,
  OAuthScope,
  UserPoolDomain,
  UserPoolClientIdentityProvider,
} from '@aws-cdk/aws-cognito';

interface CognitoProps {
  hostedAuthDomainPrefix: string;
}

/**
 * @description This Construct creates all the resources required to enable
 * oauth based authentication
 *
 *
 * We are using some of the not recommended approaches here
 * just to keep the code simple and easy to understand.
 */
export class Cognito extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { hostedAuthDomainPrefix }: CognitoProps,
  ) {
    super(scope, id);

    // configure user directory to store user and their sessions
    const userPool = new UserPool(this, 'UserPool', {
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
        },
      },
      signInAliases: {
        email: true,
        username: true,
        preferredUsername: true,
      },
      selfSignUpEnabled: true,
    });

    // configure userPoolClient for our api
    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'My Awesome App Client',
      authFlows: {
        userSrp: true,
        refreshToken: true,
      },
      oAuth: {
        flows: {
          // it is recommended to not use implicitCodeGrant flow in general
          // see more https://oauth.net/2/grant-types/implicit/#:~:text=It%20is%20not%20recommended%20to,been%20received%20by%20the%20client.
          implicitCodeGrant: true,
        },
        scopes: [OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
        callbackUrls: ['https://www.google.com'],
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      preventUserExistenceErrors: true,
    });

    // configure cognito hosted OAuth 2.0 server
    const userPoolDomain = new UserPoolDomain(this, 'UserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: hostedAuthDomainPrefix,
      },
    });
  }
}
