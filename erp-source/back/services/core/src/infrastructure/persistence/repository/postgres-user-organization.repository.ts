import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrganizationRepository } from '../../../domain/repository/user-organization.repository';
import { UserOrganization } from '../../../domain/entity/user-organization.entity';
import { OrgMemberRole, OrgMemberStatus } from '../../../domain/entity/user-organization.entity';
import { UserOrganizationOrmEntity } from '../entity/user-organization.orm-entity';

@Injectable()
export class PostgresUserOrganizationRepository implements UserOrganizationRepository {
  constructor(
    @InjectRepository(UserOrganizationOrmEntity)
    private readonly repo: Repository<UserOrganizationOrmEntity>,
  ) { }

  async findByUserId(userId: string): Promise<UserOrganization[]> {
    const rows = await this.repo.find({ where: { user_id: userId } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByOrgId(organizationId: string): Promise<UserOrganization[]> {
    const rows = await this.repo.find({ where: { organization_id: organizationId, status: 'active' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByUserAndOrg(userId: string, organizationId: string): Promise<UserOrganization | null> {
    const row = await this.repo.findOne({
      where: { user_id: userId, organization_id: organizationId },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(uo: UserOrganization): Promise<void> {
    const entity = this.repo.create({
      id: uo.id,
      user_id: uo.userId,
      organization_id: uo.organizationId,
      role: uo.role,
      status: uo.status,
    });
    await this.repo.save(entity);
  }

  async updateRole(userId: string, organizationId: string, role: string): Promise<void> {
    await this.repo.update({ user_id: userId, organization_id: organizationId }, { role });
  }

  async delete(userId: string, organizationId: string): Promise<void> {
    await this.repo.delete({ user_id: userId, organization_id: organizationId });
  }

  private toDomain(row: UserOrganizationOrmEntity): UserOrganization {
    return UserOrganization.reconstitute({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      role: row.role as OrgMemberRole,
      roleId: row.role_id ?? null,
      employeeId: row.employee_id ?? null,
      invitedBy: row.invited_by ?? null,
      status: (row.status as OrgMemberStatus) ?? OrgMemberStatus.ACTIVE,
      joinedAt: row.joined_at,
      leftAt: row.left_at ?? null,
    });
  }
}
