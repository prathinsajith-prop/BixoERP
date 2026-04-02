import {
    Entity,
    Column,
    PrimaryColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { BudgetOrmEntity } from './budget.orm-entity';

@Entity('budget_lines')
export class BudgetLineOrmEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'budget_id', type: 'uuid' })
    @Index()
    budgetId!: string;

    @ManyToOne(() => BudgetOrmEntity, (b) => b.lines, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'budget_id' })
    budget!: BudgetOrmEntity;

    @Column({ name: 'account_id', type: 'uuid' })
    accountId!: string;

    @Column({ length: 7 })
    period!: string; // YYYY-MM

    @Column({ type: 'numeric', precision: 19, scale: 4 })
    amount!: string;

    @Column({ type: 'numeric', precision: 19, scale: 4, default: 0 })
    actual!: string;

    @Column({ length: 3, default: 'USD' })
    currency!: string;
}
