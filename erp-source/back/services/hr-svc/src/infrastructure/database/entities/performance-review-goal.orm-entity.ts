import {
    Entity,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { PerformanceReviewOrmEntity } from './performance-review.orm-entity';

@Entity('performance_review_goals')
export class PerformanceReviewGoalOrmEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'review_id', type: 'uuid' })
    reviewId!: string;

    @Column({ length: 200 })
    title!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ name: 'target_date', type: 'date' })
    targetDate!: Date;

    @Column({ name: 'weight_percent', type: 'int' })
    weightPercent!: number;

    @Column({ name: 'self_score', type: 'numeric', precision: 3, scale: 1, nullable: true })
    selfScore!: number | null;

    @Column({ name: 'manager_score', type: 'numeric', precision: 3, scale: 1, nullable: true })
    managerScore!: number | null;

    @Column({ length: 20, default: 'NOT_STARTED' })
    status!: string;

    @ManyToOne(() => PerformanceReviewOrmEntity, (review) => review.goals, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'review_id' })
    review!: PerformanceReviewOrmEntity;
}
