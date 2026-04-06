import { Inject, Injectable } from '@nestjs/common';
import {
    EmployeeRepository,
    EMPLOYEE_REPOSITORY,
} from '../../domain/repositories/employee.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface UpdateEmployeeInput {
    employeeId: string;
    tenantId: string;
    updatedBy: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    managerId?: string | null;
}

export interface UpdateEmployeeOutput {
    id: string;
    employeeCode: string;
    updatedAt: Date;
}

@Injectable()
export class UpdateEmployeeUseCase {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY)
        private readonly employeeRepo: EmployeeRepository,
        @Inject(EVENT_PUBLISHER)
        private readonly eventPublisher: EventPublisher,
        @Inject(CACHE_PORT)
        private readonly cache: CachePort,
    ) { }

    async execute(input: UpdateEmployeeInput): Promise<UpdateEmployeeOutput> {
        const employee = await this.employeeRepo.findById(input.employeeId, input.tenantId);
        if (!employee) {
            throw new EntityNotFoundException('Employee', input.employeeId);
        }

        // Domain method performs status check — throws if TERMINATED
        employee.updatePersonalInfo({
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            managerId: input.managerId,
        });

        const saved = await this.employeeRepo.saveWithOutbox(employee);

        // Invalidate cache
        await this.cache.delByPattern(`employee:${input.tenantId}:*`);

        // Publish domain events
        const events = saved.clearDomainEvents();
        if (events.length > 0) {
            await this.eventPublisher.publishMany(events);
        }

        return {
            id: saved.id,
            employeeCode: saved.employeeCode,
            updatedAt: saved.updatedAt,
        };
    }
}
