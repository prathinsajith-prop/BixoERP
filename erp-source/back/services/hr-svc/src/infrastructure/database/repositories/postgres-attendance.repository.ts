import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus, AttendanceProps } from '../../../domain/entities/attendance.entity';
import { AttendanceRepository, AttendanceMonthlyStats } from '../../../domain/repositories/attendance.repository';
import { AttendanceOrmEntity } from '../entities/attendance.orm-entity';

@Injectable()
export class PostgresAttendanceRepository implements AttendanceRepository {
    constructor(
        @InjectRepository(AttendanceOrmEntity)
        private readonly repo: Repository<AttendanceOrmEntity>,
    ) { }

    async findByEmployeeAndDate(employeeId: string, date: Date, tenantId: string): Promise<Attendance | null> {
        const dateStr = date.toISOString().split('T')[0];
        const row = await this.repo
            .createQueryBuilder('a')
            .where('a.employeeId = :employeeId', { employeeId })
            .andWhere('a.tenantId = :tenantId', { tenantId })
            .andWhere("DATE(a.date) = :dateStr", { dateStr })
            .getOne();
        return row ? this.toDomain(row) : null;
    }

    async findByEmployeeAndDateRange(employeeId: string, from: Date, to: Date, tenantId: string): Promise<Attendance[]> {
        const rows = await this.repo
            .createQueryBuilder('a')
            .where('a.employeeId = :employeeId', { employeeId })
            .andWhere('a.tenantId = :tenantId', { tenantId })
            .andWhere('a.date >= :from AND a.date <= :to', {
                from: from.toISOString().split('T')[0],
                to: to.toISOString().split('T')[0],
            })
            .orderBy('a.date', 'ASC')
            .getMany();
        return rows.map((r) => this.toDomain(r));
    }

    async findByDepartmentAndDate(departmentId: string, date: Date, tenantId: string): Promise<Attendance[]> {
        const dateStr = date.toISOString().split('T')[0];
        const rows = await this.repo
            .createQueryBuilder('a')
            .innerJoin('employees', 'e', 'e.id = a.employee_id AND e.department_id = :departmentId', { departmentId })
            .where('a.tenantId = :tenantId', { tenantId })
            .andWhere("DATE(a.date) = :dateStr", { dateStr })
            .getMany();
        return rows.map((r) => this.toDomain(r));
    }

    async findAll(
        tenantId: string,
        filters: { employeeId?: string; from?: Date; to?: Date; status?: string; page: number; limit: number },
    ): Promise<{ data: Attendance[]; total: number; page: number; limit: number }> {
        const qb = this.repo.createQueryBuilder('a').where('a.tenantId = :tenantId', { tenantId });
        if (filters.employeeId) qb.andWhere('a.employeeId = :employeeId', { employeeId: filters.employeeId });
        if (filters.status) qb.andWhere('a.status = :status', { status: filters.status });
        if (filters.from) qb.andWhere('a.date >= :from', { from: filters.from.toISOString().split('T')[0] });
        if (filters.to) qb.andWhere('a.date <= :to', { to: filters.to.toISOString().split('T')[0] });
        qb.orderBy('a.date', 'DESC');
        qb.skip((filters.page - 1) * filters.limit).take(filters.limit);
        const [rows, total] = await qb.getManyAndCount();
        return { data: rows.map((r) => this.toDomain(r)), total, page: filters.page, limit: filters.limit };
    }

    async save(attendance: Attendance): Promise<Attendance> {
        const row = this.toOrm(attendance);
        const saved = await this.repo.save(row);
        return this.toDomain(saved);
    }

    async getMonthlyStats(employeeId: string, year: number, month: number, tenantId: string): Promise<AttendanceMonthlyStats> {
        const result = await this.repo
            .createQueryBuilder('a')
            .select('a.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(a.workingMinutes)', 'workingMinutes')
            .addSelect('SUM(a.overtimeMinutes)', 'overtimeMinutes')
            .where('a.employeeId = :employeeId', { employeeId })
            .andWhere('a.tenantId = :tenantId', { tenantId })
            .andWhere('EXTRACT(YEAR FROM a.date) = :year', { year })
            .andWhere('EXTRACT(MONTH FROM a.date) = :month', { month })
            .groupBy('a.status')
            .getRawMany<{ status: string; count: string; workingMinutes: string; overtimeMinutes: string }>();

        let presentDays = 0, absentDays = 0, lateDays = 0, totalWorking = 0, totalOvertime = 0;
        for (const row of result) {
            const count = parseInt(row.count, 10);
            const wm = parseInt(row.workingMinutes ?? '0', 10) || 0;
            const om = parseInt(row.overtimeMinutes ?? '0', 10) || 0;
            totalWorking += wm;
            totalOvertime += om;
            if (row.status === 'PRESENT' || row.status === 'LATE' || row.status === 'HALF_DAY') presentDays += count;
            if (row.status === 'ABSENT') absentDays += count;
            if (row.status === 'LATE') lateDays += count;
        }
        return { presentDays, absentDays, lateDays, totalWorkingMinutes: totalWorking, totalOvertimeMinutes: totalOvertime };
    }

    private toDomain(row: AttendanceOrmEntity): Attendance {
        const props: AttendanceProps = {
            employeeId: row.employeeId,
            date: row.date,
            checkInAt: row.checkInAt,
            checkOutAt: row.checkOutAt,
            status: row.status as AttendanceStatus,
            workingMinutes: row.workingMinutes,
            overtimeMinutes: row.overtimeMinutes,
            notes: row.notes,
            tenantId: row.tenantId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
        return Attendance.fromPersistence(props, row.id);
    }

    private toOrm(a: Attendance): AttendanceOrmEntity {
        const row = new AttendanceOrmEntity();
        row.id = a.id;
        row.employeeId = a.employeeId;
        row.date = a.date;
        row.checkInAt = a.checkInAt;
        row.checkOutAt = a.checkOutAt;
        row.status = a.status;
        row.workingMinutes = a.workingMinutes;
        row.overtimeMinutes = a.overtimeMinutes;
        row.notes = a.notes;
        row.tenantId = a.tenantId;
        return row;
    }
}
