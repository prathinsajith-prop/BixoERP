import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import { RequestLeaveDto, RequestLeaveDtoType, RejectLeaveDto } from '../dto/hr.dto';
import { RequestLeaveUseCase } from '../../application/use-cases/request-leave.use-case';
import { LeaveType, LeaveRequest, LeaveRequestStatus } from '../../domain/entities/leave-request.entity';
import { LeaveRequestRepository, LEAVE_REQUEST_REPOSITORY } from '../../domain/repositories/leave-request.repository';
import { EmployeeRepository, EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Leave Management')
@ApiBearerAuth()
@Controller('api/v1/hr/leave')
export class LeaveController {
  constructor(
    private readonly requestLeave: RequestLeaveUseCase,
    @Inject(LEAVE_REQUEST_REPOSITORY) private readonly leaveRepo: LeaveRequestRepository,
    @Inject(EMPLOYEE_REPOSITORY) private readonly employeeRepo: EmployeeRepository,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a leave request' })
  async submitRequest(
    @Body(new ZodValidationPipe(RequestLeaveDto)) dto: RequestLeaveDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.requestLeave.execute({
      employeeId: dto.employeeId ?? user.userId,
      leaveType: dto.leaveType as LeaveType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      totalDays: dto.totalDays,
      reason: dto.reason ?? null,
      tenantId,
    });
  }

  @Get('requests')
  @ApiOperation({ summary: 'List leave requests for current tenant' })
  async listRequests(@TenantId() tenantId: string) {
    const requests = await this.leaveRepo.findAll(tenantId);
    const employees = await this.employeeRepo.findAll(tenantId);
    const empMap = new Map(employees.map((e) => [e.id, e]));
    return requests.map((lr) => this.toResponse(lr, empMap.get(lr.employeeId)?.fullName));
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get leave request by ID' })
  async findRequestById(@Param('id') id: string, @TenantId() tenantId: string) {
    const lr = await this.leaveRepo.findById(id, tenantId);
    if (!lr) throw new EntityNotFoundException('LeaveRequest', id);
    const employee = await this.employeeRepo.findById(lr.employeeId, tenantId);
    return this.toResponse(lr, employee?.fullName);
  }

  @Post('requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a leave request' })
  async approveRequest(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const lr = await this.leaveRepo.findById(id, tenantId);
    if (!lr) throw new EntityNotFoundException('LeaveRequest', id);
    lr.approve(user.userId);
    const saved = await this.leaveRepo.update(lr);
    return this.toResponse(saved);
  }

  @Post('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a leave request' })
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const lr = await this.leaveRepo.findById(id, tenantId);
    if (!lr) throw new EntityNotFoundException('LeaveRequest', id);
    lr.reject(user.userId, body.rejectionReason);
    const saved = await this.leaveRepo.update(lr);
    return this.toResponse(saved);
  }

  @Get('balance/:employeeId')
  @ApiOperation({ summary: 'Get leave balance for an employee' })
  async getBalance(@Param('employeeId') employeeId: string, @TenantId() tenantId: string) {
    const requests = await this.leaveRepo.findByEmployee(employeeId, tenantId);
    const year = new Date().getFullYear();
    const yearRequests = requests.filter((r) => r.createdAt.getFullYear() === year);

    // Calculate balances per leave type
    const leaveTypes = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'BEREAVEMENT', 'OTHER'];
    const entitlements: Record<string, number> = { ANNUAL: 20, SICK: 10, MATERNITY: 90, PATERNITY: 10, UNPAID: 30, BEREAVEMENT: 5, OTHER: 5 };

    const balances = leaveTypes.map((lt) => {
      const typeRequests = yearRequests.filter((r) => r.leaveType === lt);
      const used = typeRequests.filter((r) => r.status === LeaveRequestStatus.APPROVED).reduce((s, r) => s + r.totalDays, 0);
      const pending = typeRequests.filter((r) => r.status === LeaveRequestStatus.PENDING).reduce((s, r) => s + r.totalDays, 0);
      const entitled = entitlements[lt] ?? 0;
      return { leaveType: lt, year, entitled, used, pending, remaining: entitled - used - pending };
    });

    return { employeeId, tenantId, balances };
  }

  private toResponse(lr: LeaveRequest, employeeName?: string) {
    return {
      id: lr.id,
      employeeId: lr.employeeId,
      employeeName: employeeName ?? null,
      leaveType: lr.leaveType,
      startDate: lr.startDate,
      endDate: lr.endDate,
      totalDays: lr.totalDays,
      reason: lr.reason,
      status: lr.status,
      approvedBy: lr.approvedBy,
      rejectionReason: lr.rejectionReason,
      createdAt: lr.createdAt,
      updatedAt: lr.updatedAt,
    };
  }
}
