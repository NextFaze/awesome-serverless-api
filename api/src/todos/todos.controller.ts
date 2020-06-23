import {
  Controller,
  Inject,
  Post,
  Param,
  Get,
  Body,
  NotFoundException,
  Delete,
  Put,
} from '@nestjs/common';
import { TOKEN } from 'src/tokens';
import { DynamoDB } from 'aws-sdk';
import { v4 } from 'uuid';
import { sanitizeIdsForClient } from 'src/utils';
import { CreateTodoDto } from './todos.dto';

@Controller('users/:userId/todos')
export class TodosController {
  constructor(
    @Inject(TOKEN.TABLE_NAME) private tableName: string,
    private dc: DynamoDB.DocumentClient,
  ) {}

  @Post()
  async create(@Param('userId') userId: string, @Body() body: CreateTodoDto) {
    // dynamo db doesn't support auto incrementing ids as is, there are some other ways you
    // can achieve that, but in our case just creating unique id will be sufficient
    const todoId = v4();
    const todo = await this.dc
      .put({
        TableName: this.tableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `TODO#${todoId}`,
          attributes: body,
        },
      })
      .promise();

    return {
      ok: true,
      created: {
        id: todoId,
      },
    };
  }

  @Get(':id')
  async findById(@Param('userId') userId: string, @Param('id') todoId: string) {
    const todoResponse = await this.dc
      .get({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `TODO#${todoId}`,
        },
      })
      .promise();

    const todo = todoResponse.Item;

    if (!todo) {
      throw new NotFoundException();
    }

    return {
      id: sanitizeIdsForClient(todo.SK, 'TODO#'),
      userId: sanitizeIdsForClient(todo.PK, 'USER#'),
      ...todo.attributes,
    };
  }

  @Get()
  async findAll(@Param('userId') userId: string) {
    const todoResponse = await this.dc
      .query({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND SK BEGINS_WITH :skType',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':skType': 'TODO',
        },
      })
      .promise();

    return todoResponse.Items.map(todo => ({
      id: sanitizeIdsForClient(todo.SK, 'TODO#'),
      userId: sanitizeIdsForClient(todo.PK, 'USER#'),
      ...todo.attributes,
    }));
  }

  @Put(':id')
  async update(
    @Param('userId') userId: string,
    @Param('id') todoId: string,
    @Body() body: CreateTodoDto,
  ) {
    const updatedTodoResponse = await this.dc
      .update({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `TODO#${todoId}`,
        },
        UpdateExpression:
          'SET attributes.title = :newTitle, attributes.note = :newNote',
        ExpressionAttributeValues: {
          ':newTitle': body.title,
          ':newNote': body.note,
        },
        ReturnValues: 'UPDATED_NEW',
      })
      .promise();

    const updatedTodo = updatedTodoResponse.Attributes;

    return {
      ok: true,
      updated: { id: todoId, ...updatedTodo },
    };
  }

  @Delete(':id')
  async deleteById(
    @Param('userId') userId: string,
    @Param('id') todoId: string,
  ) {
    await this.dc
      .delete({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `USER#${todoId}`,
        },
      })
      .promise();

    return {
      ok: true,
      deleted: {
        id: todoId,
      },
    };
  }

  @Delete()
  async deleteAll(@Param('userId') userId: string) {
    const todoResponse = await this.dc
      .query({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
        },
      })
      .promise();

    todoResponse.Items.forEach(async todo => {
      await this.dc
        .delete({
          TableName: this.tableName,
          Key: {
            PK: todo.PK,
            SK: todo.SK,
          },
        })
        .promise();
    });

    return {
      ok: true,
      deleted: {
        count: todoResponse.Count,
      },
    };
  }
}
