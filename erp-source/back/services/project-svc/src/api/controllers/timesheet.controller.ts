import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  LogTimesheetDto,
  LogTimesheetDtoType,
} from '../dto/project.dto';
import { LogTimesheetUseCase } from '../../application/use-cases';

@ApiTags('Timesheets')
@ApiBearerAuth()
@Controller('api/v1/projects/timesheets')
export class TimesheetController {
  constructor(
    private readonly logTimesheet: LogTimesheetUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(LogTimesheetDto))
  @ApiOperation({ summary: 'Log a timesheet entry' })
  async create(
    @Body() dto: LogTimesheetDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.logTimesheet.execute({
      projectId: dto.projectId,
      taskId: dto.taskId ?? null,
      employeeId: user.userId,
      date: dto.date,
      hours: dto.hours,
      description: dto.description,
      billable: dto.billable,
      tenantId,
    });
  }
}
