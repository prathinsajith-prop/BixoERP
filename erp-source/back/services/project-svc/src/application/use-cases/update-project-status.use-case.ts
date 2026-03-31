import { Inject, Injectable } from '@nestjs/common';
import { ProjectStatusEnum } from '../../domain/value-objects/project-status';
import {
  ProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  ProjectNotFoundException,
  InvalidStatusTransition,
} from '../../domain/exceptions/domain.exceptions';

export interface UpdateProjectStatusInput {
  projectId: string;
  newStatus: string;
  tenantId: string;
}

export interface UpdateProjectStatusOutput {
  id: string;
  code: string;
  previousStatus: string;
  newStatus: string;
}

@Injectable()
export class UpdateProjectStatusUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: ProjectRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: UpdateProjectStatusInput): Promise<UpdateProjectStatusOutput> {
    const project = await this.projectRepo.findById(input.projectId, input.tenantId);
    if (!project) {
      throw new ProjectNotFoundException(input.projectId);
    }

    const previousStatus = project.status;
    const targetStatus = input.newStatus as ProjectStatusEnum;

    // Validate transition (domain will throw if invalid)
    if (!project.statusVO.canTransitionTo(targetStatus)) {
      throw new InvalidStatusTransition(previousStatus, targetStatus);
    }

    project.updateStatus(targetStatus);

    // Save with outbox
    const saved = await this.projectRepo.saveWithOutbox(project);

    // Invalidate cache
    await this.cache.delByPattern(`projects:${input.tenantId}:*`);
    await this.cache.del(`project:${input.projectId}`);

    // Publish domain events (e.g. project.completed)
    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      code: saved.code,
      previousStatus,
      newStatus: saved.status,
    };
  }
}
