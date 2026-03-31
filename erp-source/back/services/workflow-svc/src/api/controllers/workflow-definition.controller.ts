import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreateWorkflowDefinitionDto,
  CreateWorkflowDefinitionDtoType,
  UpdateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDtoType,
} from '../dto/workflow.dto';
import {
  WorkflowDefinitionRepository,
  WORKFLOW_DEFINITION_REPOSITORY,
} from '../../domain/repositories/workflow-definition.repository';
import { CreateWorkflowDefinitionUseCase } from '../../application/use-cases/create-workflow-definition.use-case';
import { CACHE_PORT, CachePort } from '../../application/ports/cache.port';

@ApiTags('Workflow Definitions')
@ApiBearerAuth()
@Controller('api/v1/workflow-definitions')
export class WorkflowDefinitionController {
  constructor(
    @Inject(WORKFLOW_DEFINITION_REPOSITORY)
    private readonly definitionRepo: WorkflowDefinitionRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    private readonly createDefinition: CreateWorkflowDefinitionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow definition' })
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(CreateWorkflowDefinitionDto)) body: CreateWorkflowDefinitionDtoType,
  ) {
    const result = await this.createDefinition.execute({
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      entityType: body.entityType,
      steps: body.steps.map((s) => ({
        ...s,
        stepType: s.stepType as any,
        autoEscalateAfterHours: s.autoEscalateAfterHours ?? null,
        conditions: s.conditions ?? null,
      })),
      tenantId,
      createdBy: user.userId,
    });

    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List active workflow definitions' })
  async list(
    @TenantId() tenantId: string,
  ) {
    const cacheKey = `definitions:${tenantId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return { data: cached };

    const definitions = await this.definitionRepo.findAllActive(tenantId);
    const data = definitions.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      entityType: d.entityType,
      isActive: d.isActive,
      totalSteps: d.totalSteps,
      version: d.version,
      createdAt: d.createdAt.toISOString(),
    }));

    await this.cache.set(cacheKey, data, 300);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow definition by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const definition = await this.definitionRepo.findById(id, tenantId);
    if (!definition) {
      return { data: null };
    }

    return {
      data: {
        id: definition.id,
        code: definition.code,
        name: definition.name,
        description: definition.description,
        entityType: definition.entityType,
        steps: definition.steps,
        isActive: definition.isActive,
        totalSteps: definition.totalSteps,
        version: definition.version,
        createdBy: definition.createdBy,
        createdAt: definition.createdAt.toISOString(),
        updatedAt: definition.updatedAt.toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workflow definition' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateWorkflowDefinitionDto)) body: UpdateWorkflowDefinitionDtoType,
  ) {
    const definition = await this.definitionRepo.findById(id, tenantId);
    if (!definition) {
      return { data: null };
    }

    if (body.isActive === false) {
      definition.deactivate();
    } else if (body.isActive === true) {
      definition.activate();
    }

    const updated = await this.definitionRepo.update(definition);
    await this.cache.del(`definitions:${tenantId}`);

    return {
      data: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }
}
