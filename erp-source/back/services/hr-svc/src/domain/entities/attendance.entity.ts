import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    HALF_DAY = 'HALF_DAY',
    ON_LEAVE = 'ON_LEAVE',
    HOLIDAY = 'HOLIDAY',
    WEEKEND = 'WEEKEND',
}

export interface AttendanceProps {
    employeeId: string;
    date: Date;
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: AttendanceStatus;
    workingMinutes: number;
    overtimeMinutes: number;
    notes: string | null;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class Attendance extends Entity<AttendanceProps> {
    static create(
        props: {
            employeeId: string;
            date: Date;
            status?: AttendanceStatus;
            notes?: string | null;
            tenantId: string;
        },
        id?: string,
    ): Attendance {
        return new Attendance(
            {
                employeeId: props.employeeId,
                date: props.date,
                checkInAt: null,
                checkOutAt: null,
                status: props.status ?? AttendanceStatus.ABSENT,
                workingMinutes: 0,
                overtimeMinutes: 0,
                notes: props.notes ?? null,
                tenantId: props.tenantId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id ?? uuidv4(),
        );
    }

    static fromPersistence(props: AttendanceProps, id: string): Attendance {
        return new Attendance(props, id);
    }

    get employeeId(): string { return this.props.employeeId; }
    get date(): Date { return this.props.date; }
    get checkInAt(): Date | null { return this.props.checkInAt; }
    get checkOutAt(): Date | null { return this.props.checkOutAt; }
    get status(): AttendanceStatus { return this.props.status; }
    get workingMinutes(): number { return this.props.workingMinutes; }
    get overtimeMinutes(): number { return this.props.overtimeMinutes; }
    get notes(): string | null { return this.props.notes; }
    get tenantId(): string { return this.props.tenantId; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    checkIn(): void {
        if (this.props.checkInAt) {
            throw new BusinessRuleViolation('Already checked in');
        }
        this.props.checkInAt = new Date();
        this.props.status = AttendanceStatus.PRESENT;
        this.props.updatedAt = new Date();
    }

    checkOut(standardWorkMinutes = 480): void {
        if (!this.props.checkInAt) {
            throw new BusinessRuleViolation('Must check in first');
        }
        if (this.props.checkOutAt) {
            throw new BusinessRuleViolation('Already checked out');
        }
        this.props.checkOutAt = new Date();
        const worked = Math.floor(
            (this.props.checkOutAt.getTime() - this.props.checkInAt.getTime()) / 60000,
        );
        this.props.workingMinutes = Math.min(worked, standardWorkMinutes);
        this.props.overtimeMinutes = Math.max(0, worked - standardWorkMinutes);
        this.props.updatedAt = new Date();
    }

    markAbsent(): void {
        this.props.status = AttendanceStatus.ABSENT;
        this.props.checkInAt = null;
        this.props.checkOutAt = null;
        this.props.workingMinutes = 0;
        this.props.overtimeMinutes = 0;
        this.props.updatedAt = new Date();
    }

    markHalfDay(): void {
        this.props.status = AttendanceStatus.HALF_DAY;
        this.props.updatedAt = new Date();
    }

    setStatus(status: AttendanceStatus, notes?: string): void {
        this.props.status = status;
        if (notes !== undefined) this.props.notes = notes;
        this.props.updatedAt = new Date();
    }
}
