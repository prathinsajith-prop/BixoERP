import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './api/filter/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());  // required to read HttpOnly cookies in controllers
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger — only expose in non-production environments
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BixoERP Core API')
      .setDescription('Authentication, organisation management, and multi-org access control')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('Auth', 'Authentication and session management')
      .addTag('Organisations', 'Organisation CRUD and membership management')
      .addTag('Invitations', 'Email invitation workflow')
      .addTag('Structure', 'Department, division, and team management')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('port', 3015);
  await app.listen(port);
  console.log(`core listening on port ${port}`);
  if (config.get<string>('NODE_ENV') !== 'production') {
    console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
