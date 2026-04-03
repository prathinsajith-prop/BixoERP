import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Inject,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
    CreatePerformanceReviewDto, CreatePerformanceReviewDtoType,
    AddGoalDto, AddGoalDtoType,
    SubmitSelfReviewDto, SubmitSelfReviewDtoType,
    SubmitManagerReviewDto, SubmitManagerReviewDtoType,
} from '../dto/hr.dto';
import {
    PerformanceReviewRepository,
    PERFORMANCE_REVIEW_REPOSITORY,
} from '../../domain/repositories/performance-review.repository';
import { PerformanceReview, ReviewCycle, ReviewStatus } from '../../domain/entities/performance-review.entity';
import { BusinessRuleViolation } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Performance Reviews')
@ApiBearerAuth()
@Controller('api/v1/hr/performance')
export class PerformanceReviewController {
    constructor(
        @Inject(PERFORMANCE_REVIEW_REPOSITORY) private readonly reviewRepo: PerformanceReviewRepository,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List performance reviews with pagination' })
    async list(
        @TenantId() tenantId: string,
        @Query('employeeId') employeeId?: string,
        @Query('reviewerId') reviewerId?: string,
        @Query('status') status?: string,
        @Query('cycle') cycle?: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        const result = await this.reviewRepo.findAll(tenantId, {
            employeeId,
            reviewerId,
            status: status as ReviewStatus | undefined,
            cycle: cycle as ReviewCycle | undefined,
            page: Math.max(1, parseInt(page, 10) || 1),
            limit: Math.min(100, parseInt(limit, 10) || 20),
        });
        return {
            data: result.data.map(this.toResponse),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit),
        };
    }

    @Get('team/:managerId')
    @ApiOperation({ summary: 'Get reviews for a manager\'s team' })
    async teamReviews(
        @Param('managerId') managerId: string,
        @TenantId() tenantId: string,
    ) {
        const reviews = await this.reviewRepo.findByReviewer(managerId, tenantId);
        return reviews.map(this.toResponse);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a performance review by ID' })
    async getOne(
        @Param('id') id: string,
        @TenantId() tenantId: string,
    ) {
        const review = await this.reviewRepo.findById(id, tenantId);
        if (!review) throw new NotFoundException(`Performance review ${id} not found`);
        return this.toResponse(review);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new performance review' })
    async create(
        @Body(new ZodValidationPipe(CreatePerformanceReviewDto)) dto: CreatePerformanceReviewDtoType,
        @TenantId() tenantId: string,
        @CurrentUser() _user: { userId: string },
    ) {
        const review = PerformanceReview.create({
            employeeId: dto.employeeId,
            reviewerId: dto.reviewerId,
            cycle: dto.cycle as ReviewCycle,
            periodStart: new Date(dto.periodStart),
            periodEnd: new Date(dto.periodEnd),
            dueDate: new Date(dto.dueDate),
            tenantId,
        });
        const saved = await this.reviewRepo.save(review);
        return this.toResponse(saved);
    }

    @Post(':id/goals')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add a goal to a performance review' })
    async addGoal(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(AddGoalDto)) dto: AddGoalDtoType,
        @TenantId() tenantId: string,
    ) {
        const review = await this.reviewRepo.findById(id, tenantId);
        if (!review) throw new NotFoundException(`Performance review ${id} not found`);
        try {
            review.addGoal({
                title: dto.title,
                description: dto.description,
                targetDate: new Date(dto.targetDate),
                weightPercent: dto.weightPercent,
                selfScore: null,
                managerScore: null,
                status: 'NOT_STARTED',
            });
        } catch (e) {
            if (e instanceof BusinessRuleViolation) throw new BadRequestException(e.message);
            throw e;
        }
        const saved = await this.reviewRepo.save(review);
        return this.toResponse(saved);
    }

    @Post(':id/activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Activate a draft review (moves to SELF_REVIEW_PENDING)' })
    async activate(
        @Param('id') id: string,
        @TenantId() tenantId: string,
    ) {
        const review = await this.reviewRepo.findById(id, tenantId);
        if (!review) throw new NotFoundException(`Performance review ${id} not found`);
        try {
            review.activate();
        } catch (e) {
            if (e instanceof BusinessRuleViolation) throw new BadRequestException(e.message);
            throw e;
        }
        const saved = await this.reviewRepo.save(review);
        return this.toResponse(saved);
    }

    @Post(':id/self-review')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Submit self review with goal scores' })
    async submitSelfReview(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(SubmitSelfReviewDto)) dto: SubmitSelfReviewDtoType,
        @TenantId() tenantId: string,
    ) {
        const review = await this.reviewRepo.findById(id, tenantId);
        if (!review) throw new NotFoundException(`Performance review ${id} not found`);
        try {
            review.submitSelfReview(dto.goalScores, dto.comments);
        } catch (e) {
            if (e instanceof BusinessRuleViolation) throw new BadRequestException(e.message);
            throw e;
        }
        const saved = await this.reviewRepo.save(review);
        return this.toResponse(saved);
    }

    @Post(':id/manager-review')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Submit manager review with goal scores' })
    async submitManagerReview(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(SubmitManagerReviewDto)) dto: SubmitManagerReviewDtoType,
        @TenantId() tenantId: string,
    ) {
        const review = await this.reviewRepo.findById(id, tenantId);
        if (!review) throw new NotFoundException(`Performance review ${id} not found`);
        try {
            review.submitManagerReview(dto.goalScores, dto.comments);
        } catch (e) {
            if (e instanceof BusinessRuleViolation) throw new BadRequestException(e.message);
            throw e;
        }
        const saved = await this.reviewRepo.save(review);
        return this.toResponse(saved);
    }

    @Post(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel a performance review' })
    async cancel(
        @Param('id') id: string,
        @TenantId() tenantId: string,
    ) {
        const review = await this.reviewRepo.findById(id, tenantId);
        if (!review) throw new NotFoundException(`Performance review ${id} not found`);
        try {
            review.cancel();
        } catch (e) {
            if (e instanceof BusinessRuleViolation) throw new BadRequestException(e.message);
            throw e;
        }
        const saved = await this.reviewRepo.save(review);
        return this.toResponse(saved);
    }

    private toResponse(review: PerformanceReview) {
        return {
            id: review.id,
            employeeId: review.employeeId,
            reviewerId: review.reviewerId,
            cycle: review.cycle,
            periodStart: review.periodStart,
            periodEnd: review.periodEnd,
            dueDate: review.dueDate,
            status: review.status,
            goals: review.goals,
            overallSelfScore: review.overallSelfScore,
            overallManagerScore: review.overallManagerScore,
            selfComments: review.selfComments,
            managerComments: review.managerComments,
            tenantId: review.tenantId,
            completedAt: review.completedAt,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
        };
    }
}
