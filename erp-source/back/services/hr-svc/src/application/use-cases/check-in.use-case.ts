import { Inject, Injectable } from '@nestjs/common';
import { Attendance } from '../../domain/entities/attendance.entity';
import { AttendanceRepository, ATTENDANCE_REPOSITORY } from '../../domain/repositories/attendance.repository';
import { EmployeeRepository, EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { CachePort, CACHE_PORT } from '../ports/cache.port';

export interface CheckInInput {
    employeeId: string;
    tenantId: string;
    notes?: string;
}

export interface CheckInOutput {
    id: string;
    employeeId: string;
    date: string;
    checkInAt: Date;
    status: string;
}

@Injectable()
export class CheckInUseCase {
    constructor(
        @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepo: AttendanceRepository,
        @Inject(EMPLOYEE_REPOSITORY) private readonly employeeRepo: EmployeeRepository,
        @Inject(CACHE_PORT) private readonly cache: CachePort,
    ) { }

    async execute(input: CheckInInput): Promise<CheckInOutput> {
        const employee = await this.employeeRepo.findById(input.employeeId, input.tenantId);
        if (!employee) throw new EntityNotFoundException('Employee', input.employeeId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let record = await this.attendanceRepo.findByEmployeeAndDate(input.employeeId, today, input.tenantId);
        if (!record) {
            record = Attendance.create({
                employeeId: input.employeeId,
                date: today,
                notes: input.notes ?? null,
                tenantId: input.tenantId,
            });
        }

        record.checkIn();
        const saved = await this.attendanceRepo.save(record);
        await this.cache.delByPattern(`attendance:${input.tenantId}:*`);

        return {
            id: saved.id,
            employeeId: saved.employeeId,
            date: saved.date.toISOString().split('T')[0],
            checkInAt: saved.checkInAt!,
            status: saved.status,
        };
    }
}
