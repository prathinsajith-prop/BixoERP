import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  SubmitApprovalRequestDto,
  SubmitApprovalRequestDtoType,
  ProcessApprovalStepDto,
  ProcessApprovalStepDtoType,
  EscalateRequestDto,
  EscalateRequestDtoType,
  CancelRequestDto,
  CancelRequestDtoType,
  ListApprovalRequestsQuery,
  ListApprovalRequestsQueryType,
} from '../dto/workflow.dto';
import {
  ApprovalRequestRepository,
  APPROVAL_REQUEST_REPOSITORY,
} from '../../domain/repositories/approval-request.repository';
import { ApprovalStatus } from '../../domain/value-objects/approval-status';
import { SubmitApprovalRequestUseCase } from '../../application/use-cases/submit-approval-request.use-case';
import { ProcessApprovalStepUseCase } from '../../application/use-cases/process-approval-step.use-case';
import { EscalateRequestUseCase } from '../../application/use-cases/escalate-request.use-case';
import { PostgresDelegationRuleRepository } from '../../infrastructure/database/repositories/postgres-delegation-rule.repository';
import { CACHE_PORT, CachePort } from '../../application/ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Approval Requests')
@ApiBearerAuth()
@Controller('api/v1/approval-requests')
export class ApprovalRequestController {
  constructor(
    @Inject(APPROVAL_REQUEST_REPOSITORY)
    private readonly requestRepo: ApprovalRequestRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    private readonly submitUseCase: SubmitApprovalRequestUseCase,
    private readonly processStepUseCase: ProcessApprovalStepUseCase,
    private readonly escalateUseCase: EscalateRequestUseCase,
    private readonly delegationRuleRepo: PostgresDelegationRuleRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new approval request' })
  async submit(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(SubmitApprovalRequestDto)) body: SubmitApprovalRequestDtoType,
  ) {
    const result = await this.submitUseCase.execute({
      workflowDefinitionCode: body.workflowDefinitionCode,
      entityType: body.entityType,
      entityId: body.entityId,
      tenantId,
      requestedBy: user.userId,
      metadata: body.metadata ?? null,
    });

    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List approval requests (my requests or assigned)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async list(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Query(new ZodValidationPipe(ListApprovalRequestsQuery)) query: ListApprovalRequestsQueryType,
  ) {
    const status = query.status ? (query.status as ApprovalStatus) : undefined;
    const requests = await this.requestRepo.findByApprover(user.userId, tenantId, status);

    const data = requests.slice(query.offset, query.offset + query.limit).map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      status: r.status,
      currentStepOrder: r.currentStepOrder,
      totalSteps: r.totalSteps,
      requestedBy: r.requestedBy,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }));

    return { data, meta: { limit: query.limit, offset: query.offset } };
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'List requests submitted by the current user' })
  async myRequests(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const requests = await this.requestRepo.findByRequester(user.userId, tenantId);
    const data = requests.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      status: r.status,
      currentStepOrder: r.currentStepOrder,
      totalSteps: r.totalSteps,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }));

    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval request by ID with steps' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const request = await this.requestRepo.findById(id, tenantId);
    if (!request) {
      throw new EntityNotFoundException('ApprovalRequest', id);
    }

    return {
      data: {
        id: request.id,
        workflowDefinitionId: request.workflowDefinitionId,
        entityType: request.entityType,
        entityId: request.entityId,
        status: request.status,
        currentStepOrder: request.currentStepOrder,
        totalSteps: request.totalSteps,
        requestedBy: request.requestedBy,
        metadata: request.metadata,
        steps: request.steps.map((s) => ({
          id: s.id,
          stepOrder: s.stepOrder,
          stepName: s.stepName,
          status: s.status,
          approverUserIds: s.approverUserIds,
          decidedBy: s.decidedBy,
          decidedAt: s.decidedAt?.toISOString() ?? null,
          comment: s.comment,
          delegatedFrom: s.delegatedFrom,
        })),
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        completedAt: request.completedAt?.toISOString() ?? null,
      },
    };
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Approve or reject the current step' })
  @ApiParam({ name: 'id', type: String })
  async processStep(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string; roles: string[] },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ProcessApprovalStepDto)) body: ProcessApprovalStepDtoType,
  ) {
    const delegationRules = await this.delegationRuleRepo.findActiveByUser(user.userId, tenantId);

    const result = await this.processStepUseCase.execute({
      requestId: id,
      action: body.action,
      userId: user.userId,
      userRoles: user.roles,
      comment: body.comment ?? null,
      tenantId,
      delegationRules,
    });

    return { data: result };
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate an approval request' })
  @ApiParam({ name: 'id', type: String })
  async escalate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(EscalateRequestDto)) body: EscalateRequestDtoType,
  ) {
    const result = await this.escalateUseCase.execute({
      requestId: id,
      reason: body.reason,
      tenantId,
    });

    return { data: result };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an approval request' })
  @ApiParam({ name: 'id', type: String })
  async cancel(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    const request = await this.requestRepo.findById(id, tenantId);
    if (!request) {
      throw new EntityNotFoundException('ApprovalRequest', id);
    }

    request.cancel(user.userId);
    await this.requestRepo.saveWithOutbox(request);

    return { data: { id: request.id, status: request.status } };
  }
}
