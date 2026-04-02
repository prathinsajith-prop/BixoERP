import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { BudgetLineOrmEntity } from './budget-line.orm-entity';

@Entity('budgets')
export class BudgetOrmEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ length: 255 })
    name!: string;

    @Column({ name: 'fiscal_year', type: 'int' })
    fiscalYear!: number;

    @Column({ length: 20 })
    status!: string; // DRAFT, APPROVED, ACTIVE, CLOSED

    @Column({ name: 'approved_by', type: 'uuid', nullable: true })
    approvedBy!: string | null;

    @Column({ name: 'created_by', type: 'uuid' })
    createdBy!: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    @Index()
    tenantId!: string;

    @OneToMany(() => BudgetLineOrmEntity, (line) => line.budget, {
        cascade: true,
        eager: true,
    })
    lines!: BudgetLineOrmEntity[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
