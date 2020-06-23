import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodosController } from './todos/todos.controller';
import { TOKEN } from './tokens';
import { DynamoDB } from 'aws-sdk';

@Module({
  imports: [],
  controllers: [AppController, TodosController],
  providers: [
    AppService,
    DynamoDB.DocumentClient,
    {
      provide: TOKEN.TABLE_NAME,
      useValue: process.env.tableName,
    },
  ],
})
export class AppModule {}
