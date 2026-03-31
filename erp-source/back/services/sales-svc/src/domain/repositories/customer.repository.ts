import { Customer } from '../entities/customer.entity';

export interface CustomerRepository {
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findByCustomerNumber(customerNumber: string, tenantId: string): Promise<Customer | null>;
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;
  findAll(tenantId: string): Promise<Customer[]>;
  findActive(tenantId: string): Promise<Customer[]>;
  save(customer: Customer): Promise<Customer>;
  existsByEmail(email: string, tenantId: string): Promise<boolean>;
  nextCustomerNumber(tenantId: string): Promise<string>;
}

export const CUSTOMER_REPOSITORY = Symbol('CustomerRepository');
