import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    PerformanceReview,
    PerformanceReviewProps,
    ReviewCycle,
    ReviewGoal,
    ReviewStatus,
} from '../../../domain/entities/performance-review.entity';
import { PerformanceReviewRepository } from '../../../domain/repositories/performance-review.repository';
import { PerformanceReviewOrmEntity } from '../entities/performance-review.orm-entity';
import { PerformanceReviewGoalOrmEntity } from '../entities/performance-review-goal.orm-entity';

@Injectable()
export class PostgresPerformanceReviewRepository implements PerformanceReviewRepository {
    constructor(
        @InjectRepository(PerformanceReviewOrmEntity)
        private readonly repo: Repository<PerformanceReviewOrmEntity>,
    ) { }

    async findById(id: string, tenantId: string): Promise<PerformanceReview | null> {
        const row = await this.repo.findOne({ where: { id, tenantId } });
        return row ? this.toDomain(row) : null;
    }

    async findAll(
        tenantId: string,
        filters: {
            employeeId?: string;
            reviewerId?: string;
            status?: ReviewStatus;
            cycle?: ReviewCycle;
            page: number;
            limit: number;
        },
    ): Promise<{ data: PerformanceReview[]; total: number; page: number; limit: number }> {
        const qb = this.repo.createQueryBuilder('r').where('r.tenantId = :tenantId', { tenantId });
        if (filters.employeeId) qb.andWhere('r.employeeId = :employeeId', { employeeId: filters.employeeId });
        if (filters.reviewerId) qb.andWhere('r.reviewerId = :reviewerId', { reviewerId: filters.reviewerId });
        if (filters.status) qb.andWhere('r.status = :status', { status: filters.status });
        if (filters.cycle) qb.andWhere('r.cycle = :cycle', { cycle: filters.cycle });
        qb.orderBy('r.createdAt', 'DESC');
        qb.skip((filters.page - 1) * filters.limit).take(filters.limit);
        const [rows, total] = await qb.getManyAndCount();
        // Eager load goals for all found reviews
        const ids = rows.map((r) => r.id);
        if (ids.length > 0) {
            const withGoals = await this.repo.findByIds(ids);
            const goalsMap = new Map(withGoals.map((r) => [r.id, r.goals]));
            rows.forEach((r) => { r.goals = goalsMap.get(r.id) ?? []; });
        }
        return { data: rows.map((r) => this.toDomain(r)), total, page: filters.page, limit: filters.limit };
    }

    async findByEmployee(employeeId: string, tenantId: string): Promise<PerformanceReview[]> {
        const rows = await this.repo.find({ where: { employeeId, tenantId }, order: { createdAt: 'DESC' } });
        return rows.map((r) => this.toDomain(r));
    }

    async findByReviewer(reviewerId: string, tenantId: string): Promise<PerformanceReview[]> {
        const rows = await this.repo.find({ where: { reviewerId, tenantId }, order: { createdAt: 'DESC' } });
        return rows.map((r) => this.toDomain(r));
    }

    async save(review: PerformanceReview): Promise<PerformanceReview> {
        const row = this.toOrm(review);
        const saved = await this.repo.save(row);
        return this.toDomain(saved);
    }

    private toDomain(row: PerformanceReviewOrmEntity): PerformanceReview {
        const goals: ReviewGoal[] = (row.goals ?? []).map((g) => ({
            id: g.id,
            title: g.title,
            description: g.description,
            targetDate: g.targetDate,
            weightPercent: g.weightPercent,
            selfScore: g.selfScore !== null && g.selfScore !== undefined ? Number(g.selfScore) : null,
            managerScore: g.managerScore !== null && g.managerScore !== undefined ? Number(g.managerScore) : null,
            status: g.status as ReviewGoal['status'],
        }));
        const props: PerformanceReviewProps = {
            employeeId: row.employeeId,
            reviewerId: row.reviewerId,
            cycle: row.cycle as ReviewCycle,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            dueDate: row.dueDate,
            status: row.status as ReviewStatus,
            goals,
            overallSelfScore: row.overallSelfScore !== null && row.overallSelfScore !== undefined ? Number(row.overallSelfScore) : null,
            overallManagerScore: row.overallManagerScore !== null && row.overallManagerScore !== undefined ? Number(row.overallManagerScore) : null,
            selfComments: row.selfComments,
            managerComments: row.managerComments,
            tenantId: row.tenantId,
            completedAt: row.completedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
        return PerformanceReview.fromPersistence(props, row.id);
    }

    private toOrm(review: PerformanceReview): PerformanceReviewOrmEntity {
        const row = new PerformanceReviewOrmEntity();
        row.id = review.id;
        row.employeeId = review.employeeId;
        row.reviewerId = review.reviewerId;
        row.cycle = review.cycle;
        row.periodStart = review.periodStart;
        row.periodEnd = review.periodEnd;
        row.dueDate = review.dueDate;
        row.status = review.status;
        row.overallSelfScore = review.overallSelfScore;
        row.overallManagerScore = review.overallManagerScore;
        row.selfComments = review.selfComments;
        row.managerComments = review.managerComments;
        row.tenantId = review.tenantId;
        row.completedAt = review.completedAt;
        row.goals = review.goals.map((g) => {
            const goalOrm = new PerformanceReviewGoalOrmEntity();
            goalOrm.id = g.id;
            goalOrm.reviewId = review.id;
            goalOrm.title = g.title;
            goalOrm.description = g.description;
            goalOrm.targetDate = g.targetDate;
            goalOrm.weightPercent = g.weightPercent;
            goalOrm.selfScore = g.selfScore;
            goalOrm.managerScore = g.managerScore;
            goalOrm.status = g.status;
            return goalOrm;
        });
        return row;
    }
}
