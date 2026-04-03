import { Inject, Injectable } from '@nestjs/common';
import { AttendanceRepository, ATTENDANCE_REPOSITORY } from '../../domain/repositories/attendance.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { CachePort, CACHE_PORT } from '../ports/cache.port';

export interface CheckOutInput {
    employeeId: string;
    tenantId: string;
    standardWorkMinutes?: number;
}

export interface CheckOutOutput {
    id: string;
    employeeId: string;
    date: string;
    checkInAt: Date;
    checkOutAt: Date;
    workingMinutes: number;
    overtimeMinutes: number;
    status: string;
}

@Injectable()
export class CheckOutUseCase {
    constructor(
        @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepo: AttendanceRepository,
        @Inject(CACHE_PORT) private readonly cache: CachePort,
    ) { }

    async execute(input: CheckOutInput): Promise<CheckOutOutput> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await this.attendanceRepo.findByEmployeeAndDate(input.employeeId, today, input.tenantId);
        if (!record) throw new EntityNotFoundException('Attendance record', `${input.employeeId}/${today.toISOString()}`);

        record.checkOut(input.standardWorkMinutes ?? 480);
        const saved = await this.attendanceRepo.save(record);
        await this.cache.delByPattern(`attendance:${input.tenantId}:*`);

        return {
            id: saved.id,
            employeeId: saved.employeeId,
            date: saved.date.toISOString().split('T')[0],
            checkInAt: saved.checkInAt!,
            checkOutAt: saved.checkOutAt!,
            workingMinutes: saved.workingMinutes,
            overtimeMinutes: saved.overtimeMinutes,
            status: saved.status,
        };
    }
}
