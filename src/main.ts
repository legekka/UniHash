import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const configService: ConfigService = app.get('ConfigService');
  
  await app.listen(configService.get<string>('PORT'));
}
bootstrap();
