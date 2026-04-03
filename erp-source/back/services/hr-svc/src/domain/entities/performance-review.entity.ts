import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';

export enum ReviewStatus {
    DRAFT = 'DRAFT',
    SELF_REVIEW_PENDING = 'SELF_REVIEW_PENDING',
    MANAGER_REVIEW_PENDING = 'MANAGER_REVIEW_PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum ReviewCycle {
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    SEMI_ANNUAL = 'SEMI_ANNUAL',
    ANNUAL = 'ANNUAL',
}

export interface ReviewGoal {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    weightPercent: number;
    selfScore: number | null;
    managerScore: number | null;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
}

export interface PerformanceReviewProps {
    employeeId: string;
    reviewerId: string;
    cycle: ReviewCycle;
    periodStart: Date;
    periodEnd: Date;
    dueDate: Date;
    status: ReviewStatus;
    goals: ReviewGoal[];
    overallSelfScore: number | null;
    overallManagerScore: number | null;
    selfComments: string | null;
    managerComments: string | null;
    tenantId: string;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export class PerformanceReview extends Entity<PerformanceReviewProps> {
    static create(
        props: {
            employeeId: string;
            reviewerId: string;
            cycle: ReviewCycle;
            periodStart: Date;
            periodEnd: Date;
            dueDate: Date;
            tenantId: string;
        },
        id?: string,
    ): PerformanceReview {
        return new PerformanceReview(
            {
                employeeId: props.employeeId,
                reviewerId: props.reviewerId,
                cycle: props.cycle,
                periodStart: props.periodStart,
                periodEnd: props.periodEnd,
                dueDate: props.dueDate,
                status: ReviewStatus.DRAFT,
                goals: [],
                overallSelfScore: null,
                overallManagerScore: null,
                selfComments: null,
                managerComments: null,
                tenantId: props.tenantId,
                completedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id ?? uuidv4(),
        );
    }

    static fromPersistence(props: PerformanceReviewProps, id: string): PerformanceReview {
        return new PerformanceReview(props, id);
    }

    get employeeId(): string { return this.props.employeeId; }
    get reviewerId(): string { return this.props.reviewerId; }
    get cycle(): ReviewCycle { return this.props.cycle; }
    get periodStart(): Date { return this.props.periodStart; }
    get periodEnd(): Date { return this.props.periodEnd; }
    get dueDate(): Date { return this.props.dueDate; }
    get status(): ReviewStatus { return this.props.status; }
    get goals(): ReviewGoal[] { return this.props.goals; }
    get overallSelfScore(): number | null { return this.props.overallSelfScore; }
    get overallManagerScore(): number | null { return this.props.overallManagerScore; }
    get selfComments(): string | null { return this.props.selfComments; }
    get managerComments(): string | null { return this.props.managerComments; }
    get tenantId(): string { return this.props.tenantId; }
    get completedAt(): Date | null { return this.props.completedAt; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    addGoal(goal: Omit<ReviewGoal, 'id'>): void {
        if (this.props.status !== ReviewStatus.DRAFT) {
            throw new BusinessRuleViolation('Goals can only be added in DRAFT status');
        }
        const currentWeight = this.props.goals.reduce((sum, g) => sum + g.weightPercent, 0);
        if (currentWeight + goal.weightPercent > 100) {
            throw new BusinessRuleViolation(
                `Total goal weight cannot exceed 100%. Current: ${currentWeight}%, Adding: ${goal.weightPercent}%`,
            );
        }
        this.props.goals = [...this.props.goals, { ...goal, id: uuidv4() }];
        this.props.updatedAt = new Date();
    }

    submitSelfReview(scores: Record<string, number>, comments: string): void {
        if (this.props.status !== ReviewStatus.SELF_REVIEW_PENDING) {
            throw new BusinessRuleViolation('Self review can only be submitted when status is SELF_REVIEW_PENDING');
        }
        for (const goal of this.props.goals) {
            const score = scores[goal.id];
            if (score === undefined || score < 1 || score > 5) {
                throw new BusinessRuleViolation(`Score for goal "${goal.title}" must be between 1 and 5`);
            }
        }
        this.props.goals = this.props.goals.map((g) => ({ ...g, selfScore: scores[g.id] ?? null }));
        const totalWeight = this.props.goals.reduce((sum, g) => sum + g.weightPercent, 0);
        if (totalWeight > 0) {
            this.props.overallSelfScore =
                this.props.goals.reduce((sum, g) => sum + (g.selfScore ?? 0) * (g.weightPercent / totalWeight), 0);
            this.props.overallSelfScore = Math.round(this.props.overallSelfScore * 10) / 10;
        }
        this.props.selfComments = comments;
        this.props.status = ReviewStatus.MANAGER_REVIEW_PENDING;
        this.props.updatedAt = new Date();
    }

    submitManagerReview(scores: Record<string, number>, comments: string): void {
        if (this.props.status !== ReviewStatus.MANAGER_REVIEW_PENDING) {
            throw new BusinessRuleViolation('Manager review can only be submitted when status is MANAGER_REVIEW_PENDING');
        }
        for (const goal of this.props.goals) {
            const score = scores[goal.id];
            if (score === undefined || score < 1 || score > 5) {
                throw new BusinessRuleViolation(`Score for goal "${goal.title}" must be between 1 and 5`);
            }
        }
        this.props.goals = this.props.goals.map((g) => ({ ...g, managerScore: scores[g.id] ?? null }));
        const totalWeight = this.props.goals.reduce((sum, g) => sum + g.weightPercent, 0);
        if (totalWeight > 0) {
            this.props.overallManagerScore =
                this.props.goals.reduce((sum, g) => sum + (g.managerScore ?? 0) * (g.weightPercent / totalWeight), 0);
            this.props.overallManagerScore = Math.round(this.props.overallManagerScore * 10) / 10;
        }
        this.props.managerComments = comments;
        this.props.status = ReviewStatus.COMPLETED;
        this.props.completedAt = new Date();
        this.props.updatedAt = new Date();
    }

    activate(): void {
        if (this.props.status !== ReviewStatus.DRAFT) {
            throw new BusinessRuleViolation('Only DRAFT reviews can be activated');
        }
        this.props.status = ReviewStatus.SELF_REVIEW_PENDING;
        this.props.updatedAt = new Date();
    }

    cancel(): void {
        if (this.props.status === ReviewStatus.COMPLETED || this.props.status === ReviewStatus.CANCELLED) {
            throw new BusinessRuleViolation('Cannot cancel a completed or already cancelled review');
        }
        this.props.status = ReviewStatus.CANCELLED;
        this.props.updatedAt = new Date();
    }
}
