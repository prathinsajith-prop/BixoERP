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
import { ProcessPayrollDto, ProcessPayrollDtoType } from '../dto/hr.dto';
import { ProcessPayrollUseCase } from '../../application/use-cases/process-payroll.use-case';
import {
  PayrollRunRepository,
  PAYROLL_RUN_REPOSITORY,
} from '../../domain/repositories/payroll-run.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('api/v1/hr/payroll')
export class PayrollController {
  constructor(
    private readonly processPayroll: ProcessPayrollUseCase,
    @Inject(PAYROLL_RUN_REPOSITORY)
    private readonly payrollRunRepo: PayrollRunRepository,
  ) {}

  @Post('run')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a payroll run for a period' })
  async run(
    @Body(new ZodValidationPipe(ProcessPayrollDto)) dto: ProcessPayrollDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.processPayroll.execute({
      periodYear: dto.periodYear,
      periodMonth: dto.periodMonth,
      allowancesMap: dto.allowancesMap,
      deductionsMap: dto.deductionsMap,
      taxRate: dto.taxRate,
      currency: dto.currency,
      tenantId,
      createdBy: user.userId,
    });
  }

  @Get('runs')
  @ApiOperation({ summary: 'List payroll runs' })
  async listRuns(@TenantId() tenantId: string) {
    const runs = await this.payrollRunRepo.findAll(tenantId);
    return runs.map((r) => ({
      id: r.id,
      runNumber: r.runNumber,
      periodYear: r.periodYear,
      periodMonth: r.periodMonth,
      periodLabel: r.periodLabel,
      status: r.status,
      totalGross: { amount: r.totalGross.amountAsNumber, currency: r.currency },
      totalDeductions: { amount: r.totalDeductions.amountAsNumber, currency: r.currency },
      totalNet: { amount: r.totalNet.amountAsNumber, currency: r.currency },
      employeeCount: r.lines.length,
      currency: r.currency,
      processedAt: r.processedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  @Get('runs/period/:year/:month')
  @ApiOperation({ summary: 'Get payroll runs for a specific period' })
  async findByPeriod(
    @Param('year') year: string,
    @Param('month') month: string,
    @TenantId() tenantId: string,
  ) {
    return this.payrollRunRepo.findByPeriod(parseInt(year, 10), parseInt(month, 10), tenantId);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get payroll run by ID' })
  async findRunById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const run = await this.payrollRunRepo.findById(id, tenantId);
    if (!run) {
      throw new EntityNotFoundException('PayrollRun', id);
    }
    return run;
  }
}
