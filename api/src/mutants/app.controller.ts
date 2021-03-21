import { Controller, Post, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('hello')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post()
  create(): string {
    return this.appService.create();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
