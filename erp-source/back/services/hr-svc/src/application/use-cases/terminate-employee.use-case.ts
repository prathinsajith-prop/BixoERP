import { Inject, Injectable } from '@nestjs/common';
import {
  EmployeeRepository,
  EMPLOYEE_REPOSITORY,
} from '../../domain/repositories/employee.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  EntityNotFoundException,
} from '../../domain/exceptions/domain.exceptions';

export interface TerminateEmployeeInput {
  employeeId: string;
  reason: string;
  terminationDate: Date;
  tenantId: string;
}

@Injectable()
export class TerminateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepo: EmployeeRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: TerminateEmployeeInput): Promise<void> {
    const employee = await this.employeeRepo.findById(input.employeeId, input.tenantId);
    if (!employee) {
      throw new EntityNotFoundException('Employee', input.employeeId);
    }

    // Domain performs status check — throws if already terminated
    employee.terminate(input.reason, input.terminationDate);

    // Persist with outbox
    await this.employeeRepo.saveWithOutbox(employee);

    // Invalidate cache
    await this.cache.delByPattern(`employee:${input.tenantId}:*`);

    // Publish domain events (employee.terminated → workflow-svc, notification-svc, audit-svc)
    const events = employee.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }
  }
}
