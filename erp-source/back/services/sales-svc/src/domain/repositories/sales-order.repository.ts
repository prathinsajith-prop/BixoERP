import { SalesOrder } from '../entities/sales-order.entity';

export interface SalesOrderRepository {
  findById(id: string, tenantId: string): Promise<SalesOrder | null>;
  findByOrderNumber(orderNumber: string, tenantId: string): Promise<SalesOrder | null>;
  findByCustomer(customerId: string, tenantId: string): Promise<SalesOrder[]>;
  findByStatus(status: string, tenantId: string): Promise<SalesOrder[]>;
  findAll(tenantId: string): Promise<SalesOrder[]>;
  save(order: SalesOrder): Promise<SalesOrder>;
  saveWithOutbox(order: SalesOrder): Promise<SalesOrder>;
  nextOrderNumber(tenantId: string): Promise<string>;
}

export const SALES_ORDER_REPOSITORY = Symbol('SalesOrderRepository');
