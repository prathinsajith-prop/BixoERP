import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository, UserFilters, UserSummary } from '../../../domain/repository/user.repository';
import { User, UserStatus } from '../../../domain/entity/user.entity';
import { UserOrmEntity } from '../entity/user.orm-entity';
import { Email } from '../../../domain/value-object/email.vo';
import { HashedPassword } from '../../../domain/value-object/hashed-password.vo';
import { FilterBuilder } from '../../filter/filter-builder';
import { USER_FILTERS, USER_SEARCH_COLUMNS } from '../../filter/filter-definitions';

@Injectable()
export class PostgresUserRepository implements UserRepository {
  private readonly logger = new Logger(PostgresUserRepository.name);
  private readonly filterBuilder = FilterBuilder.for(USER_FILTERS, { logger: this.logger, context: PostgresUserRepository.name });

  /** Whitelisted sort columns to prevent SQL injection via sort_by param. */
  private readonly ALLOWED_SORT: Record<string, string> = {
    first_name: 'u.first_name',
    last_name: 'u.last_name',
    email: 'u.email',
    status: 'u.status',
    created_at: 'u.created_at',
  };

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) { }

  async findById(tenantId: string, id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdGlobal(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { tenant_id: tenantId, email } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findByTenant(
    tenantId: string,
    page: number,
    limit: number,
    filters?: UserFilters,
  ): Promise<{ users: User[]; total: number; summary: UserSummary }> {
    // ── Paginated / filtered query ──────────────────────────────────────────
    const sortCol = (filters?.sortBy && this.ALLOWED_SORT[filters.sortBy]) ?? 'u.created_at';
    const sortDir = filters?.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.repo
      .createQueryBuilder('u')
      .where('u.tenant_id = :tenantId', { tenantId })
      .orderBy(sortCol, sortDir);

    this.filterBuilder.applySearch(qb, 'u', filters?.search, USER_SEARCH_COLUMNS);
    this.filterBuilder.applyFilters(qb, 'u', filters?.filter);

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // ── Summary counts (unfiltered — always reflects whole tenant) ──────────
    const summaryRows = await this.repo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('s.tenant_id = :tenantId', { tenantId })
      .groupBy('s.status')
      .getRawMany<{ status: string; count: number }>();

    let summaryTotal = 0;
    let summaryActive = 0;
    let summaryInactive = 0;
    for (const row of summaryRows) {
      const c = Number(row.count);
      summaryTotal += c;
      if (row.status === 'ACTIVE') summaryActive = c;
      if (row.status === 'INACTIVE') summaryInactive = c;
    }

    return {
      users: rows.map((r) => this.toDomain(r)),
      total,
      summary: { total: summaryTotal, active: summaryActive, inactive: summaryInactive },
    };
  }

  async save(user: User): Promise<void> {
    await this.repo.insert(this.toOrm(user));
  }

  async update(user: User): Promise<void> {
    const orm = this.toOrm(user);
    await this.repo.update({ id: user.id, tenant_id: user.tenantId }, orm);
  }

  async updateLastLogin(userId: string, lastLoginAt: Date): Promise<void> {
    // Raw query intentionally bypasses TypeORM's @UpdateDateColumn so that
    // a successful login does NOT bump the user's "Last Updated" timestamp.
    await this.repo.query(
      'UPDATE users SET last_login_at = $1, failed_login_attempts = 0 WHERE id = $2',
      [lastLoginAt, userId],
    );
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.softDelete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      email: orm.email,
      hashedPassword: orm.hashed_password,
      firstName: orm.first_name,
      lastName: orm.last_name,
      status: orm.status as UserStatus,
      roles: orm.roles ?? [],
      failedLoginAttempts: orm.failed_login_attempts,
      lastLoginAt: orm.last_login_at,
      passwordChangedAt: orm.password_changed_at,
      emailVerifiedAt: orm.email_verified_at,
      lockedUntil: orm.locked_until,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(user: User): Partial<UserOrmEntity> {
    return {
      id: user.id,
      tenant_id: user.tenantId,
      email: user.email.value,
      hashed_password: user.hashedPassword.hash,
      first_name: user.firstName,
      last_name: user.lastName,
      status: user.status,
      roles: user.roles,
      failed_login_attempts: user.failedLoginAttempts,
      last_login_at: user.lastLoginAt,
      password_changed_at: user.passwordChangedAt,
      email_verified_at: user.emailVerifiedAt,
      locked_until: user.lockedUntil,
    };
  }
}
