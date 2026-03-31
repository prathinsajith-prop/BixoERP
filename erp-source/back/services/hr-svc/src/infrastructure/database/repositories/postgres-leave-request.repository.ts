import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, LeaveRequestProps, LeaveType, LeaveRequestStatus } from '../../../domain/entities/leave-request.entity';
import { LeaveRequestRepository } from '../../../domain/repositories/leave-request.repository';
import { LeaveRequestOrmEntity } from '../entities/leave-request.orm-entity';

@Injectable()
export class PostgresLeaveRequestRepository implements LeaveRequestRepository {
  constructor(
    @InjectRepository(LeaveRequestOrmEntity) private readonly repo: Repository<LeaveRequestOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<LeaveRequest | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmployee(employeeId: string, tenantId: string): Promise<LeaveRequest[]> {
    const rows = await this.repo.find({
      where: { employeeId, tenantId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(tenantId: string): Promise<LeaveRequest[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPending(tenantId: string): Promise<LeaveRequest[]> {
    const rows = await this.repo.find({
      where: { tenantId, status: LeaveRequestStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    const entity = this.toOrm(leaveRequest);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    return this.save(leaveRequest);
  }

  private toDomain(row: LeaveRequestOrmEntity): LeaveRequest {
    return LeaveRequest.fromPersistence(
      {
        employeeId: row.employeeId,
        leaveType: row.leaveType as LeaveType,
        startDate: row.startDate,
        endDate: row.endDate,
        totalDays: parseFloat(row.totalDays),
        reason: row.reason,
        status: row.status as LeaveRequestStatus,
        approvedBy: row.approvedBy,
        rejectionReason: row.rejectionReason,
        tenantId: row.tenantId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(lr: LeaveRequest): LeaveRequestOrmEntity {
    const entity = new LeaveRequestOrmEntity();
    entity.id = lr.id;
    entity.employeeId = lr.employeeId;
    entity.leaveType = lr.leaveType;
    entity.startDate = lr.startDate;
    entity.endDate = lr.endDate;
    entity.totalDays = String(lr.totalDays);
    entity.reason = lr.reason;
    entity.status = lr.status;
    entity.approvedBy = lr.approvedBy;
    entity.rejectionReason = lr.rejectionReason;
    entity.tenantId = lr.tenantId;
    entity.createdAt = lr.createdAt;
    entity.updatedAt = lr.updatedAt;
    return entity;
  }
}
