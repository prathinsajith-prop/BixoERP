import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamRepository } from '../../../domain/repository/team.repository';
import { Team } from '../../../domain/entity/team.entity';
import { TeamOrmEntity } from '../entity/team.orm-entity';

@Injectable()
export class PostgresTeamRepository implements TeamRepository {
  constructor(
    @InjectRepository(TeamOrmEntity)
    private readonly repo: Repository<TeamOrmEntity>,
  ) {}

  async findById(tenantId: string, id: string): Promise<Team | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByOrganization(tenantId: string, organizationId: string): Promise<Team[]> {
    const rows = await this.repo.find({
      where: { tenant_id: tenantId, organization_id: organizationId },
      order: { name: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByDepartment(tenantId: string, departmentId: string): Promise<Team[]> {
    const rows = await this.repo.find({
      where: { tenant_id: tenantId, department_id: departmentId },
      order: { name: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByCode(tenantId: string, organizationId: string, code: string): Promise<Team | null> {
    const row = await this.repo.findOne({
      where: { tenant_id: tenantId, organization_id: organizationId, code },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(team: Team): Promise<void> {
    await this.repo.insert(this.toOrm(team));
  }

  async update(team: Team): Promise<void> {
    await this.repo.update({ id: team.id, tenant_id: team.tenantId }, this.toOrm(team));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.delete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: TeamOrmEntity): Team {
    return Team.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      organizationId: orm.organization_id,
      departmentId: orm.department_id,
      name: orm.name,
      code: orm.code,
      description: orm.description,
      leadUserId: orm.lead_user_id,
      status: orm.status as 'ACTIVE' | 'INACTIVE',
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(team: Team): Partial<TeamOrmEntity> {
    return {
      id: team.id,
      tenant_id: team.tenantId,
      organization_id: team.organizationId,
      department_id: team.departmentId,
      name: team.name,
      code: team.code,
      description: team.description,
      lead_user_id: team.leadUserId,
      status: team.status,
    };
  }
}
