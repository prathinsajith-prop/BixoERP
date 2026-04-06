import { Employee } from '../entities/employee.entity';

export interface EmployeeRepository {
  findById(id: string, tenantId: string): Promise<Employee | null>;
  findByIds(ids: string[], tenantId: string): Promise<Employee[]>;
  findByEmployeeCode(employeeCode: string, tenantId: string): Promise<Employee | null>;
  findByEmail(email: string, tenantId: string): Promise<Employee | null>;
  findByDepartment(departmentId: string, tenantId: string): Promise<Employee[]>;
  findActive(tenantId: string): Promise<Employee[]>;
  findAll(tenantId: string): Promise<Employee[]>;
  save(employee: Employee): Promise<Employee>;
  update(employee: Employee): Promise<Employee>;
  generateEmployeeCode(tenantId: string): Promise<string>;
  existsByEmail(email: string, tenantId: string): Promise<boolean>;
  saveWithOutbox(employee: Employee): Promise<Employee>;
  findAllPaginated(
    tenantId: string,
    filters: {
      search?: string;
      departmentId?: string;
      status?: string;
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ data: Employee[]; total: number; page: number; limit: number }>;
}

export const EMPLOYEE_REPOSITORY = Symbol('EmployeeRepository');
