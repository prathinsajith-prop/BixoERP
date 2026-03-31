import { Inject, Injectable } from '@nestjs/common';
import {
  ProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { ProjectBudgetService, BudgetVarianceResult } from '../../domain/services/project-budget.service';
import {
  ProjectNotFoundException,
  BudgetExceededException,
} from '../../domain/exceptions/domain.exceptions';

export interface TrackBudgetVarianceInput {
  projectId: string;
  tenantId: string;
}

@Injectable()
export class TrackBudgetVarianceUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: ProjectRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: TrackBudgetVarianceInput): Promise<BudgetVarianceResult> {
    const project = await this.projectRepo.findById(input.projectId, input.tenantId);
    if (!project) {
      throw new ProjectNotFoundException(input.projectId);
    }

    if (!project.budget) {
      throw new ProjectNotFoundException(`Budget for project ${input.projectId}`);
    }

    const variance = ProjectBudgetService.calculateVariance(project.budget);

    // If budget is exceeded, raise domain event
    if (variance.isExceeded) {
      project.raiseBudgetExceeded(
        project.budget.totalActualCost,
        project.budget.totalBudget,
      );

      // Save with outbox to persist the budget exceeded event
      await this.projectRepo.saveWithOutbox(project);

      // Publish domain events (project.budget.exceeded → notification-svc, finance-svc)
      const events = project.clearDomainEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishMany(events);
      }
    }

    return variance;
  }
}
