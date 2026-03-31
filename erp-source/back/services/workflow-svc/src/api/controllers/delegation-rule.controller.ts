import { Controller, Get, Post, Patch, Delete, Body, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import { CreateDelegationRuleDto, CreateDelegationRuleDtoType } from '../dto/workflow.dto';
import { DelegationRule } from '../../domain/entities/delegation-rule.entity';
import { PostgresDelegationRuleRepository } from '../../infrastructure/database/repositories/postgres-delegation-rule.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Delegation Rules')
@ApiBearerAuth()
@Controller('api/v1/delegation-rules')
export class DelegationRuleController {
  constructor(
    private readonly delegationRuleRepo: PostgresDelegationRuleRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a delegation rule' })
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(CreateDelegationRuleDto)) body: CreateDelegationRuleDtoType,
  ) {
    const rule = DelegationRule.create({
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      tenantId,
      entityType: body.entityType ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });

    const saved = await this.delegationRuleRepo.save(rule);

    return {
      data: {
        id: saved.id,
        fromUserId: saved.fromUserId,
        toUserId: saved.toUserId,
        entityType: saved.entityType,
        startDate: saved.startDate.toISOString(),
        endDate: saved.endDate.toISOString(),
        isActive: saved.isActive,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all delegation rules for tenant' })
  async list(@TenantId() tenantId: string) {
    const rules = await this.delegationRuleRepo.findAll(tenantId);
    const data = rules.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      entityType: r.entityType,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a delegation rule' })
  @ApiParam({ name: 'id', type: String })
  async deactivate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const rule = await this.delegationRuleRepo.findById(id, tenantId);
    if (!rule) {
      throw new EntityNotFoundException('DelegationRule', id);
    }

    rule.deactivate();
    await this.delegationRuleRepo.save(rule);

    return { data: { id: rule.id, isActive: false } };
  }
}
