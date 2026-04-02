import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('fiscal_periods')
export class FiscalPeriodOrmEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate!: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate!: Date;

    @Column({ length: 20 })
    status!: string; // OPEN, SOFT_CLOSED, HARD_CLOSED

    @Column({ name: 'tenant_id', type: 'uuid' })
    @Index()
    tenantId!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
