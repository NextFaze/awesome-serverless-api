import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';
import { createServer, proxy } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Server } from 'http';

let cachedServer: Server;

const bootstrapServer = async () => {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);
  await app.init();
  return createServer(expressApp);
};

export const api = async (event, context) => {
  // use cached nestjs server if exists or create one
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
