import { z } from 'zod';

export const DomainEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  aggregateId: z.string().uuid(),
  tenantId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()),
});

/**
 * Domain events published by project-svc:
 *
 * project.created → report-svc, audit-svc
 *   { code, name, managerId, currency, startDate }
 *
 * project.completed → report-svc, audit-svc
 *   { code, name, managerId, completedAt }
 *
 * project.budget.exceeded → notification-svc, finance-svc
 *   { code, name, budgetAmount, actualSpend, currency }
 */
