import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Employee, EmployeeProps } from '../../../domain/entities/employee.entity';
import { EmployeeRepository } from '../../../domain/repositories/employee.repository';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';
import { EmploymentStatus } from '../../../domain/value-objects/employment-status';

@Injectable()
export class PostgresEmployeeRepository implements EmployeeRepository {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly repo: Repository<EmployeeOrmEntity>,
    private readonly dataSource: DataSource,
  ) { }

  async findById(id: string, tenantId: string): Promise<Employee | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmployeeCode(employeeCode: string, tenantId: string): Promise<Employee | null> {
    const row = await this.repo.findOne({ where: { employeeCode, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Employee | null> {
    const row = await this.repo.findOne({ where: { email, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByDepartment(departmentId: string, tenantId: string): Promise<Employee[]> {
    const rows = await this.repo.find({
      where: { departmentId, tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findActive(tenantId: string): Promise<Employee[]> {
    const rows = await this.repo.find({
      where: { tenantId, status: EmploymentStatus.ACTIVE },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(tenantId: string): Promise<Employee[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(employee: Employee): Promise<Employee> {
    const entity = this.toOrm(employee);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(employee: Employee): Promise<Employee> {
    return this.save(employee);
  }

  async generateEmployeeCode(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const result = (await this.dataSource.query(
      `INSERT INTO employee_code_sequences (id, organisation_id, year, last_sequence)
       VALUES (uuid_generate_v4(), $1, $2, 1)
       ON CONFLICT (organisation_id, year)
       DO UPDATE SET last_sequence = employee_code_sequences.last_sequence + 1
       RETURNING last_sequence`,
      [tenantId, year],
    )) as Array<{ last_sequence: number }>;
    const seq = result[0].last_sequence;
    return `EMP-${year}-${String(seq).padStart(5, '0')}`;
  }

  async findAllPaginated(
    tenantId: string,
    filters: {
      search?: string;
      departmentId?: string;
      status?: string;
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ data: Employee[]; total: number; page: number; limit: number }> {
    const { search, departmentId, status, page, limit, sortBy, sortOrder } = filters;
    const qb = this.repo.createQueryBuilder('e').where('e.tenantId = :tenantId', { tenantId });
    if (search) {
      qb.andWhere(
        '(LOWER(e.firstName) LIKE :search OR LOWER(e.lastName) LIKE :search OR LOWER(e.email) LIKE :search OR e.employeeCode LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }
    if (departmentId) qb.andWhere('e.departmentId = :departmentId', { departmentId });
    if (status) qb.andWhere('e.status = :status', { status });
    const allowedSortCols: Record<string, string> = {
      lastName: 'e.lastName', firstName: 'e.firstName',
      hireDate: 'e.hireDate', employeeCode: 'e.employeeCode',
    };
    const sortCol = allowedSortCols[sortBy ?? ''] ?? 'e.lastName';
    qb.orderBy(sortCol, sortOrder === 'desc' ? 'DESC' : 'ASC');
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map((r) => this.toDomain(r)), total, page, limit };
  }

  async findByIds(ids: string[], tenantId: string): Promise<Employee[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.find({ where: { id: In(ids), tenantId } });
    return rows.map((r) => this.toDomain(r));
  }

  async existsByEmail(email: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email, tenantId } });
    return count > 0;
  }

  /** Save employee + outbox event in the SAME transaction (Outbox Pattern) */
  async saveWithOutbox(employee: Employee): Promise<Employee> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // The employee code was already generated by the use case via generateEmployeeCode()
      // and is already set on the domain entity. We just persist it as-is.
      const entity = this.toOrm(employee);
      const savedEntity = await queryRunner.manager.save(EmployeeOrmEntity, entity);

      // Write domain events to the outbox table in the same transaction
      const domainEvents = employee.domainEvents;
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
      return this.toDomain(savedEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toDomain(row: EmployeeOrmEntity): Employee {
    return Employee.fromPersistence(
      {
        employeeCode: row.employeeCode,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        dateOfBirth: row.dateOfBirth,
        hireDate: row.hireDate,
        terminationDate: row.terminationDate,
        departmentId: row.departmentId,
        positionId: row.positionId,
        managerId: row.managerId,
        status: row.status as EmploymentStatus,
        baseSalary: Money.create(row.baseSalary, row.currency),
        currency: row.currency,
        tenantId: row.tenantId,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(employee: Employee): EmployeeOrmEntity {
    const entity = new EmployeeOrmEntity();
    entity.id = employee.id;
    entity.employeeCode = employee.employeeCode;
    entity.firstName = employee.firstName;
    entity.lastName = employee.lastName;
    entity.email = employee.email;
    entity.phone = employee.phone;
    entity.dateOfBirth = employee.dateOfBirth;
    entity.hireDate = employee.hireDate;
    entity.terminationDate = employee.terminationDate;
    entity.departmentId = employee.departmentId;
    entity.positionId = employee.positionId;
    entity.managerId = employee.managerId;
    entity.status = employee.status;
    entity.baseSalary = employee.baseSalary.amount;
    entity.currency = employee.currency;
    entity.tenantId = employee.tenantId;
    entity.createdBy = employee.createdBy;
    entity.createdAt = employee.createdAt;
    entity.updatedAt = employee.updatedAt;
    return entity;
  }
}
