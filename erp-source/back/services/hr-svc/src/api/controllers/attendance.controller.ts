import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
    CheckInDto, CheckInDtoType,
    CheckOutDto, CheckOutDtoType,
    MarkAttendanceDto, MarkAttendanceDtoType,
} from '../dto/hr.dto';
import { CheckInUseCase } from '../../application/use-cases/check-in.use-case';
import { CheckOutUseCase } from '../../application/use-cases/check-out.use-case';
import { GetAttendanceUseCase } from '../../application/use-cases/get-attendance.use-case';
import { MarkAttendanceUseCase } from '../../application/use-cases/mark-attendance.use-case';
import {
    AttendanceRepository,
    ATTENDANCE_REPOSITORY,
} from '../../domain/repositories/attendance.repository';
import { AttendanceStatus } from '../../domain/entities/attendance.entity';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('api/v1/hr/attendance')
export class AttendanceController {
    constructor(
        private readonly checkIn: CheckInUseCase,
        private readonly checkOut: CheckOutUseCase,
        private readonly getAttendanceUseCase: GetAttendanceUseCase,
        private readonly markAttendance: MarkAttendanceUseCase,
        @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepo: AttendanceRepository,
    ) { }

    @Post('check-in')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Record check-in for an employee' })
    async checkInHandler(
        @Body(new ZodValidationPipe(CheckInDto)) dto: CheckInDtoType,
        @TenantId() tenantId: string,
        @CurrentUser() user: { userId: string; employeeId?: string },
    ) {
        const employeeId = dto.employeeId ?? user.employeeId;
        if (!employeeId) {
            throw new EntityNotFoundException('Employee', 'current user has no linked employee');
        }
        return this.checkIn.execute({ employeeId, tenantId, notes: dto.notes });
    }

    @Post('check-out')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Record check-out for an employee' })
    async checkOutHandler(
        @Body(new ZodValidationPipe(CheckOutDto)) dto: CheckOutDtoType,
        @TenantId() tenantId: string,
        @CurrentUser() user: { userId: string; employeeId?: string },
    ) {
        const employeeId = dto.employeeId ?? user.employeeId;
        if (!employeeId) {
            throw new EntityNotFoundException('Employee', 'current user has no linked employee');
        }
        return this.checkOut.execute({ employeeId, tenantId });
    }

    @Get()
    @ApiOperation({ summary: 'List attendance records with filters and pagination' })
    async list(
        @TenantId() tenantId: string,
        @Query('employeeId') employeeId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '25', 10) || 25));
        return this.getAttendanceUseCase.execute({
            tenantId,
            employeeId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            status,
            page: pageNum,
            limit: limitNum,
        });
    }

    @Get('today')
    @ApiOperation({ summary: "Today's attendance for all active employees" })
    async today(@TenantId() tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.getAttendanceUseCase.execute({ tenantId, from: today, to: today, page: 1, limit: 500 });
    }

    @Get('stats/:employeeId')
    @ApiOperation({ summary: 'Monthly attendance statistics for an employee' })
    async stats(
        @Param('employeeId') employeeId: string,
        @TenantId() tenantId: string,
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        const now = new Date();
        const y = parseInt(year ?? String(now.getFullYear()), 10);
        const m = parseInt(month ?? String(now.getMonth() + 1), 10);
        return this.attendanceRepo.getMonthlyStats(employeeId, y, m, tenantId);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Admin override of attendance status' })
    async override(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(MarkAttendanceDto)) dto: MarkAttendanceDtoType,
        @TenantId() tenantId: string,
    ) {
        const records = await this.attendanceRepo.findAll(tenantId, { page: 1, limit: 1000 });
        const record = records.data.find((a) => a.id === id);
        if (!record) throw new EntityNotFoundException('Attendance', id);

        record.setStatus(dto.status as AttendanceStatus, dto.notes);
        const saved = await this.attendanceRepo.save(record);
        return {
            id: saved.id,
            employeeId: saved.employeeId,
            date: saved.date.toISOString().split('T')[0],
            status: saved.status,
            notes: saved.notes,
        };
    }
}
