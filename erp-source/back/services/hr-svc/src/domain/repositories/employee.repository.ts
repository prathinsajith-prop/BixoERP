import { Employee } from '../entities/employee.entity';

export interface EmployeeRepository {
  findById(id: string, tenantId: string): Promise<Employee | null>;
  findByEmployeeNumber(employeeNumber: string, tenantId: string): Promise<Employee | null>;
  findByEmail(email: string, tenantId: string): Promise<Employee | null>;
  findByDepartment(departmentId: string, tenantId: string): Promise<Employee[]>;
  findActive(tenantId: string): Promise<Employee[]>;
  findAll(tenantId: string): Promise<Employee[]>;
  save(employee: Employee): Promise<Employee>;
  update(employee: Employee): Promise<Employee>;
  nextEmployeeNumber(tenantId: string): Promise<string>;
  existsByEmail(email: string, tenantId: string): Promise<boolean>;
  saveWithOutbox(employee: Employee): Promise<Employee>;
}

export const EMPLOYEE_REPOSITORY = Symbol('EmployeeRepository');
