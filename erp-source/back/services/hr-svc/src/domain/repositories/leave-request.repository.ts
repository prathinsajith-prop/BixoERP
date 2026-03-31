import { LeaveRequest } from '../entities/leave-request.entity';

export interface LeaveRequestRepository {
  findById(id: string, tenantId: string): Promise<LeaveRequest | null>;
  findByEmployee(employeeId: string, tenantId: string): Promise<LeaveRequest[]>;
  findAll(tenantId: string): Promise<LeaveRequest[]>;
  findPending(tenantId: string): Promise<LeaveRequest[]>;
  save(leaveRequest: LeaveRequest): Promise<LeaveRequest>;
  update(leaveRequest: LeaveRequest): Promise<LeaveRequest>;
}

export const LEAVE_REQUEST_REPOSITORY = Symbol('LeaveRequestRepository');
