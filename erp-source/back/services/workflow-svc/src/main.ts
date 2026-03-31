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
    origin: (config.get<string>('cors.origins') || 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Workflow Service')
    .setDescription('ERP Workflow Microservice — Approval Workflows, Multi-step Approvals, Delegation Rules, Escalation')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') || 3009;
  await app.listen(port);
  console.log(`workflow-svc running on port ${port}`);
}

bootstrap();
