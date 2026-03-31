import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrganizationRepository } from '../../../domain/repository/user-organization.repository';
import { UserOrganization } from '../../../domain/entity/user-organization.entity';
import { OrgMemberRole } from '../../../domain/entity/user-organization.entity';
import { UserOrganizationOrmEntity } from '../entity/user-organization.orm-entity';

@Injectable()
export class PostgresUserOrganizationRepository implements UserOrganizationRepository {
  constructor(
    @InjectRepository(UserOrganizationOrmEntity)
    private readonly repo: Repository<UserOrganizationOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<UserOrganization[]> {
    const rows = await this.repo.find({ where: { user_id: userId } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByOrgId(organizationId: string): Promise<UserOrganization[]> {
    const rows = await this.repo.find({ where: { organization_id: organizationId } });
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
    });
    await this.repo.save(entity);
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
      joinedAt: row.joined_at,
    });
  }
}
