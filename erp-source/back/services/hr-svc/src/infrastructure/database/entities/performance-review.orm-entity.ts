import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { PerformanceReviewGoalOrmEntity } from './performance-review-goal.orm-entity';

@Entity('performance_reviews')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'reviewerId'])
@Index(['tenantId', 'status'])
export class PerformanceReviewOrmEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'employee_id', type: 'uuid' })
    employeeId!: string;

    @Column({ name: 'reviewer_id', type: 'uuid' })
    reviewerId!: string;

    @Column({ length: 20 })
    cycle!: string;

    @Column({ name: 'period_start', type: 'date' })
    periodStart!: Date;

    @Column({ name: 'period_end', type: 'date' })
    periodEnd!: Date;

    @Column({ name: 'due_date', type: 'date' })
    dueDate!: Date;

    @Column({ length: 30, default: 'DRAFT' })
    status!: string;

    @Column({ name: 'overall_self_score', type: 'numeric', precision: 3, scale: 1, nullable: true })
    overallSelfScore!: number | null;

    @Column({ name: 'overall_manager_score', type: 'numeric', precision: 3, scale: 1, nullable: true })
    overallManagerScore!: number | null;

    @Column({ name: 'self_comments', type: 'text', nullable: true })
    selfComments!: string | null;

    @Column({ name: 'manager_comments', type: 'text', nullable: true })
    managerComments!: string | null;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId!: string;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt!: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;

    @OneToMany(() => PerformanceReviewGoalOrmEntity, (goal) => goal.review, {
        cascade: true,
        eager: true,
    })
    goals!: PerformanceReviewGoalOrmEntity[];
}
