import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodosController } from './todos/todos.controller';

@Module({
  imports: [],
  controllers: [AppController, TodosController],
  providers: [AppService],
})
export class AppModule {}
