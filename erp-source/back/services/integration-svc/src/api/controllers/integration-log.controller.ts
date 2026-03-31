import { Controller, Get, Query, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TenantId } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  ListIntegrationLogsSchema,
  ListIntegrationLogsDto,
} from '../dto/integration-log.schemas';
import {
  INTEGRATION_LOG_REPOSITORY,
  IntegrationLogRepository,
} from '../../domain/repositories/integration-log.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Integration Logs')
@ApiBearerAuth()
@Controller('api/v1/integrations/logs')
export class IntegrationLogController {
  constructor(
    @Inject(INTEGRATION_LOG_REPOSITORY) private readonly repo: IntegrationLogRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List integration logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'subscriptionId', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SUCCESS', 'FAILED', 'PENDING', 'RETRYING'] })
  @ApiQuery({ name: 'direction', required: false, enum: ['OUTBOUND', 'INBOUND'] })
  async list(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(ListIntegrationLogsSchema)) query: ListIntegrationLogsDto,
  ) {
    const [logs, total] = await Promise.all([
      this.repo.findByTenant(tenantId, {
        limit: query.limit,
        offset: query.offset,
        subscriptionId: query.subscriptionId,
        eventType: query.eventType,
        status: query.status,
        direction: query.direction,
      }),
      this.repo.countByTenant(tenantId, {
        subscriptionId: query.subscriptionId,
        eventType: query.eventType,
        status: query.status,
      }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        subscriptionId: log.subscriptionId,
        eventType: log.eventType,
        direction: log.direction,
        url: log.url,
        method: log.method,
        responseStatus: log.responseStatus,
        status: log.status,
        durationMs: log.durationMs,
        attempt: log.attempt,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: { limit: query.limit, offset: query.offset, total },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration log detail' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const log = await this.repo.findById(id, tenantId);
    if (!log) {
      throw new EntityNotFoundException('IntegrationLog', id);
    }

    return {
      data: {
        id: log.id,
        subscriptionId: log.subscriptionId,
        eventType: log.eventType,
        direction: log.direction,
        url: log.url,
        method: log.method,
        requestHeaders: log.requestHeaders,
        requestBody: log.requestBody,
        responseStatus: log.responseStatus,
        responseHeaders: log.responseHeaders,
        responseBody: log.responseBody,
        status: log.status,
        durationMs: log.durationMs,
        attempt: log.attempt,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt.toISOString(),
      },
    };
  }
}
