import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './api/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') || 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sales Service')
    .setDescription('ERP Sales Microservice — Sales Orders, Customers, Quotations, Price Lists')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1/sales')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') || 3004;
  await app.listen(port);
  console.log(`sales-svc running on port ${port}`);
}

bootstrap();
