import { Inject, Injectable } from '@nestjs/common';
import { Employee } from '../../domain/entities/employee.entity';
import { Money } from '../../domain/value-objects/money';
import {
  EmployeeRepository,
  EMPLOYEE_REPOSITORY,
} from '../../domain/repositories/employee.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  DuplicateEntryException,
} from '../../domain/exceptions/domain.exceptions';

export interface HireEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date;
  hireDate: Date;
  departmentId: string;
  positionId: string;
  managerId: string | null;
  baseSalary: number;
  currency: string;
  tenantId: string;
  createdBy: string;
}

export interface HireEmployeeOutput {
  id: string;
  employeeCode: string;
  status: string;
}

@Injectable()
export class HireEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepo: EmployeeRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: HireEmployeeInput): Promise<HireEmployeeOutput> {
    // Check duplicate email
    const emailExists = await this.employeeRepo.existsByEmail(input.email, input.tenantId);
    if (emailExists) {
      throw new DuplicateEntryException('email', input.email);
    }

    // Generate employee code
    const employeeCode = await this.employeeRepo.generateEmployeeCode(input.tenantId);

    // Create aggregate
    const employee = Employee.create({
      employeeCode,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      hireDate: input.hireDate,
      departmentId: input.departmentId,
      positionId: input.positionId,
      managerId: input.managerId,
      baseSalary: Money.create(input.baseSalary, input.currency),
      currency: input.currency,
      tenantId: input.tenantId,
      createdBy: input.createdBy,
    });

    // Save with outbox (same transaction)
    const saved = await this.employeeRepo.saveWithOutbox(employee);

    // Invalidate cache
    await this.cache.delByPattern(`employee:${input.tenantId}:*`);

    // Publish domain events (employee.hired → notification-svc, audit-svc)
    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      employeeCode: saved.employeeCode,
      status: saved.status,
    };
  }
}
