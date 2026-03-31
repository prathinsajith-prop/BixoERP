import type { AuditFields, Money } from "./common";

// ─── Human Resources ─────────────────────────

export type EmployeeStatus = "active" | "on-leave" | "terminated" | "probation";

export interface Employee extends AuditFields {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  positionTitle: string;
  managerId: string | null;
  status: EmployeeStatus;
  hireDate: string;
  terminationDate: string | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
  parentId: string | null;
}

export interface PayrollRun extends AuditFields {
  id: string;
  period: string;
  status: "draft" | "calculated" | "approved" | "processed" | "paid";
  totalGross: Money;
  totalDeductions: Money;
  totalNet: Money;
  employeeCount: number;
}

export interface LeaveRequest extends AuditFields {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "annual" | "sick" | "personal" | "unpaid" | "maternity" | "paternity";
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
}
