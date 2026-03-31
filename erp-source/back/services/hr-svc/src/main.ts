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
    .setTitle('HR Service')
    .setDescription('ERP HR Microservice — Employee Management, Payroll, Leave, Departments, Positions')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1/hr')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') || 3003;
  await app.listen(port);
  console.log(`hr-svc running on port ${port}`);
}

bootstrap();
