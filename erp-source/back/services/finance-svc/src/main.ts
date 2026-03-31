import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './api/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  // CORS — configured per allowed origin, not wildcard (Golden Rule)
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') || 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Finance Service')
    .setDescription('ERP Finance Microservice — Chart of Accounts, Journal Entries, Invoices, Budgets')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1/finance')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') || 3001;
  await app.listen(port);
  console.log(`finance-svc running on port ${port}`);
}

bootstrap();
