import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';

@Entity('attendance')
@Unique(['employeeId', 'date'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'date'])
export class AttendanceOrmEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'employee_id', type: 'uuid' })
    employeeId!: string;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ name: 'check_in_at', type: 'timestamptz', nullable: true })
    checkInAt!: Date | null;

    @Column({ name: 'check_out_at', type: 'timestamptz', nullable: true })
    checkOutAt!: Date | null;

    @Column({ length: 30, default: 'ABSENT' })
    status!: string;

    @Column({ name: 'working_minutes', type: 'int', default: 0 })
    workingMinutes!: number;

    @Column({ name: 'overtime_minutes', type: 'int', default: 0 })
    overtimeMinutes!: number;

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}
