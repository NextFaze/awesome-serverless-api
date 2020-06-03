#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwesomeServerlessApiStack } from '../lib/awesome-serverless-api-stack';

const app = new cdk.App();
new AwesomeServerlessApiStack(app, 'AwesomeServerlessApiStack');
