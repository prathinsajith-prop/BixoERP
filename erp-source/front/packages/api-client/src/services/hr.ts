import { ApiClient } from "../client";
import type { Employee, Department, PayrollRun, LeaveRequest } from "@erp/shared";

export const hrApi = (client: ApiClient) => ({
  employees: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Employee>("/api/v1/hr/employees", params),
    get: (id: string) => client.get<Employee>(`/api/v1/hr/employees/${id}`),
    create: (data: Partial<Employee>) => client.post<Employee>("/api/v1/hr/employees", data),
    update: (id: string, data: Partial<Employee>) => client.put<Employee>(`/api/v1/hr/employees/${id}`, data),
  },
  departments: {
    list: () => client.list<Department>("/api/v1/hr/departments"),
    get: (id: string) => client.get<Department>(`/api/v1/hr/departments/${id}`),
    create: (data: Partial<Department>) => client.post<Department>("/api/v1/hr/departments", data),
  },
  payroll: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<PayrollRun>("/api/v1/hr/payroll", params),
    get: (id: string) => client.get<PayrollRun>(`/api/v1/hr/payroll/${id}`),
    create: (data: Partial<PayrollRun>) => client.post<PayrollRun>("/api/v1/hr/payroll", data),
    process: (id: string) => client.post(`/api/v1/hr/payroll/${id}/process`),
  },
  leave: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<LeaveRequest>("/api/v1/hr/leave", params),
    create: (data: Partial<LeaveRequest>) => client.post<LeaveRequest>("/api/v1/hr/leave", data),
    approve: (id: string) => client.post(`/api/v1/hr/leave/${id}/approve`),
    reject: (id: string, reason: string) => client.post(`/api/v1/hr/leave/${id}/reject`, { reason }),
  },
});
