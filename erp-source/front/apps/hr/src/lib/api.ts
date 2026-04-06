import { useAuthStore } from "@erp/shell";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: await getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Response types matching actual backend responses ───

export interface EmployeeResponse {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string;
  hireDate: string;
  terminationDate: string | null;
  departmentId: string;
  departmentName: string | null;
  positionId: string;
  positionTitle: string | null;
  managerId: string | null;
  status: string;
  baseSalary: { amount: number; currency: string };
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentResponse {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionResponse {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  minSalary: { amount: number; currency: string };
  maxSalary: { amount: number; currency: string };
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestResponse {
  id: string;
  employeeId: string;
  employeeName: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRunResponse {
  id: string;
  runNumber: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  status: string;
  totalGross: { amount: number; currency: string };
  totalDeductions: { amount: number; currency: string };
  totalNet: { amount: number; currency: string };
  employeeCount: number;
  currency: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  tenantId: string;
  balances: {
    leaveType: string;
    year: number;
    entitled: number;
    used: number;
    pending: number;
    remaining: number;
  }[];
}

// ─── API functions ───

export const api = {
  employees: {
    list: () => request<EmployeeResponse[]>("GET", "/api/v1/hr/employees"),
    get: (id: string) => request<EmployeeResponse>("GET", `/api/v1/hr/employees/${encodeURIComponent(id)}`),
    create: (data: Record<string, unknown>) => request<EmployeeResponse>("POST", "/api/v1/hr/employees", data),
    update: (id: string, data: Record<string, unknown>) => request<EmployeeResponse>("PUT", `/api/v1/hr/employees/${encodeURIComponent(id)}`, data),
    terminate: (id: string, data: { reason: string; terminationDate: string }) =>
      request("POST", `/api/v1/hr/employees/${encodeURIComponent(id)}/terminate`, data),
    transfer: (id: string, data: { departmentId: string; positionId: string; managerId?: string }) =>
      request("POST", `/api/v1/hr/employees/${encodeURIComponent(id)}/transfer`, data),
    byDepartment: (deptId: string) =>
      request<EmployeeResponse[]>("GET", `/api/v1/hr/employees/department/${encodeURIComponent(deptId)}`),
  },
  departments: {
    list: () => request<DepartmentResponse[]>("GET", "/api/v1/hr/departments"),
    get: (id: string) => request<DepartmentResponse>("GET", `/api/v1/hr/departments/${encodeURIComponent(id)}`),
    create: (data: Record<string, unknown>) => request<DepartmentResponse>("POST", "/api/v1/hr/departments", data),
    update: (id: string, data: Record<string, unknown>) =>
      request<DepartmentResponse>("PUT", `/api/v1/hr/departments/${encodeURIComponent(id)}`, data),
  },
  positions: {
    list: (departmentId?: string) =>
      request<PositionResponse[]>("GET", `/api/v1/hr/positions${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ""}`),
    get: (id: string) => request<PositionResponse>("GET", `/api/v1/hr/positions/${encodeURIComponent(id)}`),
    create: (data: Record<string, unknown>) => request<PositionResponse>("POST", "/api/v1/hr/positions", data),
  },
  leave: {
    list: () => request<LeaveRequestResponse[]>("GET", "/api/v1/hr/leave/requests"),
    get: (id: string) => request<LeaveRequestResponse>("GET", `/api/v1/hr/leave/requests/${encodeURIComponent(id)}`),
    submit: (data: Record<string, unknown>) => request<LeaveRequestResponse>("POST", "/api/v1/hr/leave/request", data),
    approve: (id: string) => request("POST", `/api/v1/hr/leave/requests/${encodeURIComponent(id)}/approve`),
    reject: (id: string, rejectionReason: string) =>
      request("POST", `/api/v1/hr/leave/requests/${encodeURIComponent(id)}/reject`, { rejectionReason }),
    balance: (employeeId: string) => request<LeaveBalance>("GET", `/api/v1/hr/leave/balance/${encodeURIComponent(employeeId)}`),
  },
  payroll: {
    list: () => request<PayrollRunResponse[]>("GET", "/api/v1/hr/payroll/runs"),
    get: (id: string) => request<PayrollRunResponse>("GET", `/api/v1/hr/payroll/runs/${encodeURIComponent(id)}`),
    run: (data: Record<string, unknown>) => request("POST", "/api/v1/hr/payroll/run", data),
  },
};
