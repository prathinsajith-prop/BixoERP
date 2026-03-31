import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DelegationRule, DelegationRuleProps } from '../../../domain/entities/delegation-rule.entity';
import { DelegationRuleOrmEntity } from '../entities/delegation-rule.orm-entity';

@Injectable()
export class PostgresDelegationRuleRepository {
  constructor(
    @InjectRepository(DelegationRuleOrmEntity)
    private readonly repo: Repository<DelegationRuleOrmEntity>,
  ) {}

  async findActiveByUser(fromUserId: string, tenantId: string): Promise<DelegationRule[]> {
    const now = new Date();
    const rows = await this.repo
      .createQueryBuilder('d')
      .where('d.from_user_id = :fromUserId', { fromUserId })
      .andWhere('d.tenant_id = :tenantId', { tenantId })
      .andWhere('d.is_active = true')
      .andWhere('d.start_date <= :now', { now })
      .andWhere('d.end_date >= :now', { now })
      .getMany();
    return rows.map((r) => this.toDomain(r));
  }

  async findByDelegatee(toUserId: string, tenantId: string): Promise<DelegationRule[]> {
    const rows = await this.repo.find({
      where: { toUserId, tenantId, isActive: true },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(rule: DelegationRule): Promise<DelegationRule> {
    const entity = this.toOrm(rule);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string, tenantId: string): Promise<DelegationRule | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(tenantId: string): Promise<DelegationRule[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  private toOrm(domain: DelegationRule): DelegationRuleOrmEntity {
    const entity = new DelegationRuleOrmEntity();
    entity.id = domain.id;
    entity.fromUserId = domain.fromUserId;
    entity.toUserId = domain.toUserId;
    entity.tenantId = domain.tenantId;
    entity.entityType = domain.entityType;
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate;
    entity.isActive = domain.isActive;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  private toDomain(row: DelegationRuleOrmEntity): DelegationRule {
    const props: DelegationRuleProps = {
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      tenantId: row.tenantId,
      entityType: row.entityType,
      startDate: row.startDate,
      endDate: row.endDate,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return DelegationRule.reconstitute(row.id, props);
  }
}
