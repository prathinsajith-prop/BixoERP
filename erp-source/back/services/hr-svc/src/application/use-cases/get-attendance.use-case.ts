import { Inject, Injectable } from '@nestjs/common';
import { Attendance } from '../../domain/entities/attendance.entity';
import { AttendanceRepository, ATTENDANCE_REPOSITORY } from '../../domain/repositories/attendance.repository';

export interface GetAttendanceInput {
    tenantId: string;
    employeeId?: string;
    from?: Date;
    to?: Date;
    status?: string;
    page: number;
    limit: number;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: string;
    workingMinutes: number;
    overtimeMinutes: number;
    notes: string | null;
}

export interface GetAttendanceOutput {
    data: AttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class GetAttendanceUseCase {
    constructor(
        @Inject(ATTENDANCE_REPOSITORY) private readonly attendanceRepo: AttendanceRepository,
    ) { }

    async execute(input: GetAttendanceInput): Promise<GetAttendanceOutput> {
        const result = await this.attendanceRepo.findAll(input.tenantId, {
            employeeId: input.employeeId,
            from: input.from,
            to: input.to,
            status: input.status,
            page: input.page,
            limit: input.limit,
        });

        return {
            data: result.data.map((a) => this.toRecord(a)),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit),
        };
    }

    private toRecord(a: Attendance): AttendanceRecord {
        return {
            id: a.id,
            employeeId: a.employeeId,
            date: a.date.toISOString().split('T')[0],
            checkInAt: a.checkInAt,
            checkOutAt: a.checkOutAt,
            status: a.status,
            workingMinutes: a.workingMinutes,
            overtimeMinutes: a.overtimeMinutes,
            notes: a.notes,
        };
    }
}
