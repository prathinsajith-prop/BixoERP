import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './api/filter/global-exception.filter';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = config.get<number>('port', 3015);
  await app.listen(port);
  console.log(`core listening on port ${port}`);
}

bootstrap();
