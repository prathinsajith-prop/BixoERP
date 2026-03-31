import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import configuration from './infrastructure/config/configuration';

// ORM Entities
import {
  FileMetadataOrmEntity,
  FileVersionOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
} from './infrastructure/database/entities';

// Domain repository tokens
import { FILE_METADATA_REPOSITORY } from './domain/repositories/file-metadata.repository';

// Infrastructure implementations
import { PostgresFileMetadataRepository } from './infrastructure/database/repositories/postgres-file-metadata.repository';
import { S3StorageAdapter } from './infrastructure/storage/s3-storage.adapter';
import { KafkaEventPublisher } from './infrastructure/kafka/producers/kafka-event-publisher';
import { KafkaEventConsumer } from './infrastructure/kafka/consumers/kafka-event-consumer';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay';

// Application ports
import { EVENT_PUBLISHER } from './application/ports/event-publisher.port';
import { CACHE_PORT } from './application/ports/cache.port';
import { STORAGE_PORT } from './application/ports/storage.port';

// Use cases
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { DownloadFileUseCase } from './application/use-cases/download-file.use-case';
import { DeleteFileUseCase } from './application/use-cases/delete-file.use-case';
import { ListFilesUseCase } from './application/use-cases/list-files.use-case';
import { UpdateFileMetadataUseCase } from './application/use-cases/update-file-metadata.use-case';

// Controllers
import { FileController } from './api/controllers/file.controller';
import { HealthController } from './infrastructure/health/health.controller';

// Middleware
import { JwtMiddleware } from './api/middleware/jwt.middleware';

const ormEntities = [
  FileMetadataOrmEntity,
  FileVersionOrmEntity,
  OutboxEventOrmEntity,
  ProcessedEventOrmEntity,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: ormEntities,
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
    TerminusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [FileController, HealthController],
  providers: [
    // Infrastructure → Domain port bindings
    { provide: FILE_METADATA_REPOSITORY, useClass: PostgresFileMetadataRepository },
    { provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher },
    { provide: CACHE_PORT, useClass: RedisCache },
    { provide: STORAGE_PORT, useClass: S3StorageAdapter },

    // Infrastructure services
    KafkaEventPublisher,
    KafkaEventConsumer,
    OutboxRelay,

    // Use cases
    UploadFileUseCase,
    DownloadFileUseCase,
    DeleteFileUseCase,
    ListFilesUseCase,
    UpdateFileMetadataUseCase,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(JwtMiddleware)
      .exclude('health', 'health/(.*)', 'docs', 'docs/(.*)')
      .forRoutes('*');
  }
}
