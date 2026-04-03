import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  HireEmployeeDto,
  HireEmployeeDtoType,
  TerminateEmployeeDto,
  TerminateEmployeeDtoType,
  TransferEmployeeDto,
  TransferEmployeeDtoType,
} from '../dto/hr.dto';
import {
  HireEmployeeUseCase,
  TerminateEmployeeUseCase,
} from '../../application/use-cases';
import {
  EmployeeRepository,
  EMPLOYEE_REPOSITORY,
} from '../../domain/repositories/employee.repository';
import {
  DepartmentRepository,
  DEPARTMENT_REPOSITORY,
} from '../../domain/repositories/department.repository';
import {
  PositionRepository,
  POSITION_REPOSITORY,
} from '../../domain/repositories/position.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { Employee } from '../../domain/entities/employee.entity';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('api/v1/hr/employees')
export class EmployeeController {
  constructor(
    private readonly hireEmployee: HireEmployeeUseCase,
    private readonly terminateEmployee: TerminateEmployeeUseCase,
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepo: EmployeeRepository,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
    @Inject(POSITION_REPOSITORY)
    private readonly positionRepo: PositionRepository,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Hire a new employee' })
  async hire(
    @Body(new ZodValidationPipe(HireEmployeeDto)) dto: HireEmployeeDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.hireEmployee.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone ?? null,
      dateOfBirth: new Date(dto.dateOfBirth),
      hireDate: new Date(dto.hireDate),
      departmentId: dto.departmentId,
      positionId: dto.positionId,
      managerId: dto.managerId ?? null,
      baseSalary: dto.baseSalary,
      currency: dto.currency,
      tenantId,
      createdBy: user.userId,
    });
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate an employee' })
  async terminate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TerminateEmployeeDto)) dto: TerminateEmployeeDtoType,
    @TenantId() tenantId: string,
  ) {
    await this.terminateEmployee.execute({
      employeeId: id,
      reason: dto.reason,
      terminationDate: new Date(dto.terminationDate),
      tenantId,
    });
    return { message: 'Employee terminated successfully' };
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer an employee to a new department/position' })
  async transfer(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TransferEmployeeDto)) dto: TransferEmployeeDtoType,
    @TenantId() tenantId: string,
  ) {
    const employee = await this.employeeRepo.findById(id, tenantId);
    if (!employee) {
      throw new EntityNotFoundException('Employee', id);
    }
    employee.transfer(dto.departmentId, dto.positionId, dto.managerId ?? null);
    await this.employeeRepo.saveWithOutbox(employee);
    return { message: 'Employee transferred successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List all employees for current tenant' })
  async list(@TenantId() tenantId: string) {
    const [employees, departments, positions] = await Promise.all([
      this.employeeRepo.findAll(tenantId),
      this.departmentRepo.findAll(tenantId),
      this.positionRepo.findAll(tenantId),
    ]);
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    const posMap = new Map(positions.map((p) => [p.id, p.title]));
    return employees.map((e) => this.toResponse(e, deptMap.get(e.departmentId), posMap.get(e.positionId)));
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'List employees by department' })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
    @TenantId() tenantId: string,
  ) {
    const employees = await this.employeeRepo.findByDepartment(departmentId, tenantId);
    const positions = await this.positionRepo.findAll(tenantId);
    const dept = await this.departmentRepo.findById(departmentId, tenantId);
    const posMap = new Map(positions.map((p) => [p.id, p.title]));
    return employees.map((e) => this.toResponse(e, dept?.name, posMap.get(e.positionId)));
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get employee by employee code' })
  async findByCode(
    @Param('code') code: string,
    @TenantId() tenantId: string,
  ) {
    const employee = await this.employeeRepo.findByEmployeeCode(code, tenantId);
    if (!employee) {
      throw new EntityNotFoundException('Employee', code);
    }
    const [dept, pos] = await Promise.all([
      this.departmentRepo.findById(employee.departmentId, tenantId),
      this.positionRepo.findById(employee.positionId, tenantId),
    ]);
    return this.toResponse(employee, dept?.name, pos?.title);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const employee = await this.employeeRepo.findById(id, tenantId);
    if (!employee) {
      throw new EntityNotFoundException('Employee', id);
    }
    const [dept, pos] = await Promise.all([
      this.departmentRepo.findById(employee.departmentId, tenantId),
      this.positionRepo.findById(employee.positionId, tenantId),
    ]);
    return this.toResponse(employee, dept?.name, pos?.title);
  }

  private toResponse(emp: Employee, departmentName?: string, positionTitle?: string) {
    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      dateOfBirth: emp.dateOfBirth,
      hireDate: emp.hireDate,
      terminationDate: emp.terminationDate,
      departmentId: emp.departmentId,
      departmentName: departmentName ?? null,
      positionId: emp.positionId,
      positionTitle: positionTitle ?? null,
      managerId: emp.managerId,
      status: emp.status,
      baseSalary: { amount: emp.baseSalary.amountAsNumber, currency: emp.currency },
      currency: emp.currency,
      createdBy: emp.createdBy,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    };
  }
}
