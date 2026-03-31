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

  // CORS — configured per allowed origin, not wildcard
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') || 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Project Service')
    .setDescription('ERP Project Microservice — Project Management, Tasks, Milestones, Budgets, Timesheets')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1/projects')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') || 3008;
  await app.listen(port);
  console.log(`project-svc running on port ${port}`);
}

bootstrap();
