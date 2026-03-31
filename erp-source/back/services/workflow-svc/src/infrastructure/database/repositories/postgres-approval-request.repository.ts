import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThanOrEqual, Repository } from 'typeorm';
import { ApprovalRequestRepository } from '../../../domain/repositories/approval-request.repository';
import { ApprovalRequest, ApprovalRequestProps } from '../../../domain/entities/approval-request.entity';
import { ApprovalStep, ApprovalStepProps, ApprovalStepStatus } from '../../../domain/entities/approval-step.entity';
import { ApprovalStatus } from '../../../domain/value-objects/approval-status';
import { ApprovalRequestOrmEntity } from '../entities/approval-request.orm-entity';
import { ApprovalStepOrmEntity } from '../entities/approval-step.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';

@Injectable()
export class PostgresApprovalRequestRepository implements ApprovalRequestRepository {
  constructor(
    @InjectRepository(ApprovalRequestOrmEntity)
    private readonly repo: Repository<ApprovalRequestOrmEntity>,
    @InjectRepository(ApprovalStepOrmEntity)
    private readonly stepRepo: Repository<ApprovalStepOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<ApprovalRequest | null> {
    const row = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['steps'],
      order: { steps: { stepOrder: 'ASC' } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEntity(entityType: string, entityId: string, tenantId: string): Promise<ApprovalRequest[]> {
    const rows = await this.repo.find({
      where: { entityType, entityId, tenantId },
      relations: ['steps'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByApprover(userId: string, tenantId: string, status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    const qb = this.repo
      .createQueryBuilder('ar')
      .innerJoinAndSelect('ar.steps', 'step')
      .where('ar.tenant_id = :tenantId', { tenantId })
      .andWhere('step.approver_user_ids @> :userId', { userId: JSON.stringify([userId]) });

    if (status) {
      qb.andWhere('ar.status = :status', { status });
    }

    qb.orderBy('ar.created_at', 'DESC');
    const rows = await qb.getMany();
    return rows.map((r) => this.toDomain(r));
  }

  async findByRequester(requestedBy: string, tenantId: string): Promise<ApprovalRequest[]> {
    const rows = await this.repo.find({
      where: { requestedBy, tenantId },
      relations: ['steps'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPendingEscalatable(thresholdDate: Date, tenantId?: string): Promise<ApprovalRequest[]> {
    const where: Record<string, unknown> = { status: In([ApprovalStatus.PENDING, ApprovalStatus.ESCALATED]) };
    if (tenantId) where.tenantId = tenantId;

    const rows = await this.repo.find({
      where,
      relations: ['steps'],
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(request: ApprovalRequest): Promise<ApprovalRequest> {
    const entity = this.toOrm(request);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async saveWithOutbox(request: ApprovalRequest): Promise<ApprovalRequest> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrm(request);

      // Save steps separately, then request
      const savedEntity = await queryRunner.manager.save(ApprovalRequestOrmEntity, {
        ...entity,
        steps: undefined,
      } as any);

      // Save steps
      for (const stepEntity of entity.steps) {
        stepEntity.requestId = savedEntity.id;
        await queryRunner.manager.save(ApprovalStepOrmEntity, stepEntity);
      }

      // Write domain events to the outbox table
      const domainEvents = request.clearDomainEvents();
      for (const event of domainEvents) {
        const outbox = new OutboxEventOrmEntity();
        outbox.eventId = event.eventId;
        outbox.eventType = event.eventType;
        outbox.aggregateId = event.aggregateId;
        outbox.tenantId = event.tenantId;
        outbox.payload = event.payload;
        outbox.processed = false;
        outbox.processedAt = null;
        await queryRunner.manager.save(OutboxEventOrmEntity, outbox);
      }

      await queryRunner.commitTransaction();

      // Reload with relations
      const full = await this.repo.findOne({
        where: { id: savedEntity.id },
        relations: ['steps'],
      });
      return full ? this.toDomain(full) : this.toDomain(savedEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toOrm(domain: ApprovalRequest): ApprovalRequestOrmEntity {
    const entity = new ApprovalRequestOrmEntity();
    entity.id = domain.id;
    entity.workflowDefinitionId = domain.workflowDefinitionId;
    entity.entityType = domain.entityType;
    entity.entityId = domain.entityId;
    entity.tenantId = domain.tenantId;
    entity.requestedBy = domain.requestedBy;
    entity.status = domain.status;
    entity.currentStepOrder = domain.currentStepOrder;
    entity.totalSteps = domain.totalSteps;
    entity.metadata = domain.metadata;
    entity.completedAt = domain.completedAt;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    entity.steps = domain.steps.map((s) => {
      const step = new ApprovalStepOrmEntity();
      step.id = s.id;
      step.requestId = domain.id;
      step.stepOrder = s.stepOrder;
      step.stepName = s.stepName;
      step.approverUserIds = s.approverUserIds;
      step.approverRoleIds = s.approverRoleIds;
      step.status = s.status;
      step.decidedBy = s.decidedBy;
      step.decidedAt = s.decidedAt;
      step.comment = s.comment;
      step.delegatedFrom = s.delegatedFrom;
      step.createdAt = s.createdAt;
      return step;
    });

    return entity;
  }

  private toDomain(row: ApprovalRequestOrmEntity): ApprovalRequest {
    const steps = (row.steps || [])
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s) => {
        const stepProps: ApprovalStepProps = {
          requestId: s.requestId,
          stepOrder: s.stepOrder,
          stepName: s.stepName,
          approverUserIds: s.approverUserIds || [],
          approverRoleIds: s.approverRoleIds || [],
          status: s.status as ApprovalStepStatus,
          decidedBy: s.decidedBy,
          decidedAt: s.decidedAt,
          comment: s.comment,
          delegatedFrom: s.delegatedFrom,
          createdAt: s.createdAt,
        };
        return ApprovalStep.reconstitute(s.id, stepProps);
      });

    const props: ApprovalRequestProps = {
      workflowDefinitionId: row.workflowDefinitionId,
      entityType: row.entityType,
      entityId: row.entityId,
      tenantId: row.tenantId,
      requestedBy: row.requestedBy,
      status: row.status as ApprovalStatus,
      currentStepOrder: row.currentStepOrder,
      totalSteps: row.totalSteps,
      steps,
      metadata: row.metadata,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ApprovalRequest.reconstitute(row.id, props);
  }
}
