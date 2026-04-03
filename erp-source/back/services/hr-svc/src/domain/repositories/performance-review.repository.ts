import { PerformanceReview, ReviewCycle, ReviewStatus } from '../entities/performance-review.entity';

export interface PerformanceReviewRepository {
    findById(id: string, tenantId: string): Promise<PerformanceReview | null>;
    findAll(
        tenantId: string,
        filters: {
            employeeId?: string;
            reviewerId?: string;
            status?: ReviewStatus;
            cycle?: ReviewCycle;
            page: number;
            limit: number;
        },
    ): Promise<{ data: PerformanceReview[]; total: number; page: number; limit: number }>;
    findByEmployee(employeeId: string, tenantId: string): Promise<PerformanceReview[]>;
    findByReviewer(reviewerId: string, tenantId: string): Promise<PerformanceReview[]>;
    save(review: PerformanceReview): Promise<PerformanceReview>;
}

export const PERFORMANCE_REVIEW_REPOSITORY = Symbol('PerformanceReviewRepository');
