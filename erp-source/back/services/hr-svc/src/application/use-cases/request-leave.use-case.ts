import { Inject, Injectable } from '@nestjs/common';
import { LeaveRequest, LeaveType } from '../../domain/entities/leave-request.entity';
import {
  EmployeeRepository,
  EMPLOYEE_REPOSITORY,
} from '../../domain/repositories/employee.repository';
import {
  LeaveRequestRepository,
  LEAVE_REQUEST_REPOSITORY,
} from '../../domain/repositories/leave-request.repository';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  EntityNotFoundException,
  BusinessRuleViolation,
} from '../../domain/exceptions/domain.exceptions';
import { EmploymentStatus } from '../../domain/value-objects/employment-status';

export interface RequestLeaveInput {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  tenantId: string;
}

export interface RequestLeaveOutput {
  id: string;
  status: string;
  totalDays: number;
  leaveType: string;
}

@Injectable()
export class RequestLeaveUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepo: EmployeeRepository,
    @Inject(LEAVE_REQUEST_REPOSITORY)
    private readonly leaveRepo: LeaveRequestRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: RequestLeaveInput): Promise<RequestLeaveOutput> {
    const employee = await this.employeeRepo.findById(input.employeeId, input.tenantId);
    if (!employee) {
      throw new EntityNotFoundException('Employee', input.employeeId);
    }
    if (employee.status === EmploymentStatus.TERMINATED) {
      throw new BusinessRuleViolation('Cannot request leave for a terminated employee');
    }

    const leaveRequest = LeaveRequest.create({
      employeeId: input.employeeId,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays: input.totalDays,
      reason: input.reason,
      tenantId: input.tenantId,
    });

    const saved = await this.leaveRepo.save(leaveRequest);
    await this.cache.delByPattern(`leave:${input.tenantId}:${input.employeeId}:*`);

    return {
      id: saved.id,
      status: saved.status,
      totalDays: saved.totalDays,
      leaveType: saved.leaveType,
    };
  }
}
