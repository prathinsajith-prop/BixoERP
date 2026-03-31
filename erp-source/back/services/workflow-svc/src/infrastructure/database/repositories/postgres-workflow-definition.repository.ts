import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinitionRepository } from '../../../domain/repositories/workflow-definition.repository';
import { WorkflowDefinition, WorkflowDefinitionProps, WorkflowStepDefinition } from '../../../domain/entities/workflow-definition.entity';
import { WorkflowDefinitionOrmEntity } from '../entities/workflow-definition.orm-entity';
import { WorkflowStepType } from '../../../domain/value-objects/workflow-step-type';

@Injectable()
export class PostgresWorkflowDefinitionRepository implements WorkflowDefinitionRepository {
  constructor(
    @InjectRepository(WorkflowDefinitionOrmEntity)
    private readonly repo: Repository<WorkflowDefinitionOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<WorkflowDefinition | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<WorkflowDefinition | null> {
    const row = await this.repo.findOne({ where: { code, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByEntityType(entityType: string, tenantId: string): Promise<WorkflowDefinition[]> {
    const rows = await this.repo.find({ where: { entityType, tenantId, isActive: true } });
    return rows.map((r) => this.toDomain(r));
  }

  async findAllActive(tenantId: string): Promise<WorkflowDefinition[]> {
    const rows = await this.repo.find({
      where: { tenantId, isActive: true },
      order: { code: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    const entity = this.toOrm(definition);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    return this.save(definition);
  }

  private toOrm(domain: WorkflowDefinition): WorkflowDefinitionOrmEntity {
    const entity = new WorkflowDefinitionOrmEntity();
    entity.id = domain.id;
    entity.code = domain.code;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.entityType = domain.entityType;
    entity.tenantId = domain.tenantId;
    entity.steps = domain.steps as unknown as Record<string, unknown>[];
    entity.isActive = domain.isActive;
    entity.version = domain.version;
    entity.createdBy = domain.createdBy;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  private toDomain(row: WorkflowDefinitionOrmEntity): WorkflowDefinition {
    const steps: WorkflowStepDefinition[] = (row.steps || []).map((s: any) => ({
      stepOrder: s.stepOrder,
      name: s.name,
      stepType: s.stepType as WorkflowStepType,
      approverUserIds: s.approverUserIds || [],
      approverRoleIds: s.approverRoleIds || [],
      autoEscalateAfterHours: s.autoEscalateAfterHours ?? null,
      conditions: s.conditions ?? null,
    }));

    const props: WorkflowDefinitionProps = {
      code: row.code,
      name: row.name,
      description: row.description,
      entityType: row.entityType,
      tenantId: row.tenantId,
      steps,
      isActive: row.isActive,
      version: row.version,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return WorkflowDefinition.reconstitute(row.id, props);
  }
}
