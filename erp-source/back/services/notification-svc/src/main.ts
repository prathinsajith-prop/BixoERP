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

  // CORS
  app.enableCors({
    origin: config.get<string[]>('cors.origins') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription('ERP Notification Microservice — Email, In-App, Push, SMS, Templates, Preferences, Real-time SSE')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1/notifications')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') || 3010;
  await app.listen(port);
  console.log(`notification-svc running on port ${port}`);
}

bootstrap();
