import { Invoice } from '../entities/invoice.entity';

export interface InvoiceRepository {
  findById(id: string, tenantId: string): Promise<Invoice | null>;
  findByInvoiceNumber(number: string, tenantId: string): Promise<Invoice | null>;
  findByCustomer(customerId: string, tenantId: string): Promise<Invoice[]>;
  findOverdue(tenantId: string): Promise<Invoice[]>;
  findByStatus(status: string, tenantId: string): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
  nextInvoiceNumber(tenantId: string): Promise<string>;
  saveWithOutbox(invoice: Invoice): Promise<Invoice>;
}

export const INVOICE_REPOSITORY = Symbol('InvoiceRepository');
