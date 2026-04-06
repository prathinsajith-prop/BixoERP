import { Inject, Injectable } from '@nestjs/common';
import { Attendance, AttendanceStatus } from '../../domain/entities/attendance.entity';
import { AttendanceRepository, ATTENDANCE_REPOSITORY } from '../../domain/repositories/attendance.repository';
import { EmployeeRepository, EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { CachePort, CACHE_PORT } from '../ports/cache.port';

export interface MarkAttendanceInput {
    employeeId: string;
    date: Date;
    status: AttendanceStatus;
    notes?: string;
    tenantId: string;
}

export interface MarkAttendanceOutput {
    id: string;
    employeeId: string;
    date: string;
    status: string;
}

@Injectable()
export class MarkAttendanceUseCase {
    constructor(
        @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepo: AttendanceRepository,
        @Inject(EMPLOYEE_REPOSITORY) private readonly employeeRepo: EmployeeRepository,
        @Inject(CACHE_PORT) private readonly cache: CachePort,
    ) { }

    async execute(input: MarkAttendanceInput): Promise<MarkAttendanceOutput> {
        const employee = await this.employeeRepo.findById(input.employeeId, input.tenantId);
        if (!employee) throw new EntityNotFoundException('Employee', input.employeeId);

        const day = new Date(input.date);
        day.setHours(0, 0, 0, 0);

        let record = await this.attendanceRepo.findByEmployeeAndDate(input.employeeId, day, input.tenantId);
        if (!record) {
            record = Attendance.create({
                employeeId: input.employeeId,
                date: day,
                status: input.status,
                notes: input.notes ?? null,
                tenantId: input.tenantId,
            });
        } else {
            record.setStatus(input.status, input.notes);
        }

        const saved = await this.attendanceRepo.save(record);
        await this.cache.delByPattern(`attendance:${input.tenantId}:*`);

        return {
            id: saved.id,
            employeeId: saved.employeeId,
            date: saved.date.toISOString().split('T')[0],
            status: saved.status,
        };
    }
}
