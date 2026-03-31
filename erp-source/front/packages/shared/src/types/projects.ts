import type { AuditFields, Money } from "./common";

// ─── Projects ────────────────────────────────

export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";

export interface Project extends AuditFields {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId: string;
  managerName: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: Money;
  actualCost: Money;
  completionPercentage: number;
}

export interface ProjectTask extends AuditFields {
  id: string;
  projectId: string;
  name: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}
