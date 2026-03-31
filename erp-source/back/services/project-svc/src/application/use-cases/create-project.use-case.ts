import { Inject, Injectable } from '@nestjs/common';
import { Project } from '../../domain/entities/project.entity';
import {
  ProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  DuplicateEntryException,
  BusinessRuleViolation,
} from '../../domain/exceptions/domain.exceptions';

export interface CreateProjectInput {
  name: string;
  description: string;
  managerId: string;
  customerId?: string | null;
  startDate: string;
  endDate?: string | null;
  currency: string;
  tenantId: string;
  createdBy: string;
}

export interface CreateProjectOutput {
  id: string;
  code: string;
  name: string;
  status: string;
}

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: ProjectRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    // Generate project code
    const code = await this.projectRepo.nextProjectCode(input.tenantId);

    // Check for duplicate code
    const exists = await this.projectRepo.existsByCode(code, input.tenantId);
    if (exists) {
      throw new DuplicateEntryException('projectCode', code);
    }

    // Create aggregate
    const project = Project.create({
      code,
      name: input.name,
      description: input.description,
      managerId: input.managerId,
      customerId: input.customerId ?? null,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      currency: input.currency,
      tenantId: input.tenantId,
      createdBy: input.createdBy,
    });

    // Save with outbox (same transaction)
    const saved = await this.projectRepo.saveWithOutbox(project);

    // Invalidate cache
    await this.cache.delByPattern(`projects:${input.tenantId}:*`);

    // Publish domain events
    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      status: saved.status,
    };
  }
}
