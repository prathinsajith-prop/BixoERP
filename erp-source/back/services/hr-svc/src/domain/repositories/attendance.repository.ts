import { Attendance } from '../entities/attendance.entity';

export interface AttendanceMonthlyStats {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalWorkingMinutes: number;
    totalOvertimeMinutes: number;
}

export interface AttendanceRepository {
    findByEmployeeAndDate(employeeId: string, date: Date, tenantId: string): Promise<Attendance | null>;
    findByEmployeeAndDateRange(employeeId: string, from: Date, to: Date, tenantId: string): Promise<Attendance[]>;
    findByDepartmentAndDate(departmentId: string, date: Date, tenantId: string): Promise<Attendance[]>;
    findAll(
        tenantId: string,
        filters: {
            employeeId?: string;
            from?: Date;
            to?: Date;
            status?: string;
            page: number;
            limit: number;
        },
    ): Promise<{ data: Attendance[]; total: number; page: number; limit: number }>;
    save(attendance: Attendance): Promise<Attendance>;
    getMonthlyStats(employeeId: string, year: number, month: number, tenantId: string): Promise<AttendanceMonthlyStats>;
}

export const ATTENDANCE_REPOSITORY = Symbol('AttendanceRepository');
