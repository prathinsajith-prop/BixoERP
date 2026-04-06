import { z } from 'zod';

export const HireEmployeeDto = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).nullable().optional(),
  dateOfBirth: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date' }),
  hireDate: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date' }),
  departmentId: z.string().uuid(),
  positionId: z.string().uuid(),
  managerId: z.string().uuid().nullable().optional(),
  baseSalary: z.number().positive(),
  currency: z.string().length(3),
});

export type HireEmployeeDtoType = z.infer<typeof HireEmployeeDto>;

export const TerminateEmployeeDto = z.object({
  reason: z.string().min(1).max(1000),
  terminationDate: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date' }),
});

export type TerminateEmployeeDtoType = z.infer<typeof TerminateEmployeeDto>;

export const TransferEmployeeDto = z.object({
  departmentId: z.string().uuid(),
  positionId: z.string().uuid(),
  managerId: z.string().uuid().nullable().optional(),
});

export type TransferEmployeeDtoType = z.infer<typeof TransferEmployeeDto>;

export const ProcessPayrollDto = z.object({
  periodYear: z.number().int().min(2000).max(2100),
  periodMonth: z.number().int().min(1).max(12),
  allowancesMap: z.record(z.string().uuid(), z.number().min(0)).default({}),
  deductionsMap: z.record(z.string().uuid(), z.number().min(0)).default({}),
  taxRate: z.number().min(0).max(100),
  currency: z.string().length(3),
});

export type ProcessPayrollDtoType = z.infer<typeof ProcessPayrollDto>;

export const RequestLeaveDto = z.object({
  employeeId: z.string().uuid().optional(),
  leaveType: z.enum(['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'BEREAVEMENT', 'OTHER']),
  startDate: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date' }),
  endDate: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date' }),
  totalDays: z.number().positive(),
  reason: z.string().max(1000).nullable().optional(),
});

export type RequestLeaveDtoType = z.infer<typeof RequestLeaveDto>;

export const ApproveLeaveDto = z.object({
  leaveRequestId: z.string().uuid(),
});

export const RejectLeaveDto = z.object({
  leaveRequestId: z.string().uuid(),
  rejectionReason: z.string().min(1).max(1000),
});

export const CreateDepartmentDto = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type CreateDepartmentDtoType = z.infer<typeof CreateDepartmentDto>;

export const UpdateEmployeeDto = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
}).refine(
  (d) => Object.values(d).some((v) => v !== undefined),
  { message: 'At least one field must be provided' },
);
export type UpdateEmployeeDtoType = z.infer<typeof UpdateEmployeeDto>;

export const CreatePositionDto = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(255),
  departmentId: z.string().uuid(),
  minSalary: z.number().min(0),
  maxSalary: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().max(1000).nullable().optional(),
});

export type CreatePositionDtoType = z.infer<typeof CreatePositionDto>;

export const CheckInDto = z.object({
  employeeId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});
export type CheckInDtoType = z.infer<typeof CheckInDto>;

export const CheckOutDto = z.object({
  employeeId: z.string().uuid().optional(),
});
export type CheckOutDtoType = z.infer<typeof CheckOutDto>;

export const MarkAttendanceDto = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND']),
  notes: z.string().max(500).optional(),
});
export type MarkAttendanceDtoType = z.infer<typeof MarkAttendanceDto>;

// ─── Performance Review DTOs ─────────────────────────────────────────────────

export const CreatePerformanceReviewDto = z.object({
  employeeId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  cycle: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']),
  periodStart: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  periodEnd: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
export type CreatePerformanceReviewDtoType = z.infer<typeof CreatePerformanceReviewDto>;

export const AddGoalDto = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  targetDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  weightPercent: z.number().int().min(1).max(100),
});
export type AddGoalDtoType = z.infer<typeof AddGoalDto>;

export const SubmitSelfReviewDto = z.object({
  goalScores: z.record(z.string().uuid(), z.number().min(1).max(5)),
  comments: z.string().min(1).max(5000),
});
export type SubmitSelfReviewDtoType = z.infer<typeof SubmitSelfReviewDto>;

export const SubmitManagerReviewDto = z.object({
  goalScores: z.record(z.string().uuid(), z.number().min(1).max(5)),
  comments: z.string().min(1).max(5000),
});
export type SubmitManagerReviewDtoType = z.infer<typeof SubmitManagerReviewDto>;
