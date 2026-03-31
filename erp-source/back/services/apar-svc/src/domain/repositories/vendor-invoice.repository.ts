import { VendorInvoice } from '../entities/vendor-invoice.entity';

export interface VendorInvoiceRepository {
  findById(id: string, tenantId: string): Promise<VendorInvoice | null>;
  findByInvoiceNumber(number: string, tenantId: string): Promise<VendorInvoice | null>;
  findByVendor(vendorId: string, tenantId: string): Promise<VendorInvoice[]>;
  findByStatus(status: string, tenantId: string): Promise<VendorInvoice[]>;
  findOverdue(tenantId: string): Promise<VendorInvoice[]>;
  findApprovedUnpaid(tenantId: string): Promise<VendorInvoice[]>;
  findByPurchaseOrder(poId: string, tenantId: string): Promise<VendorInvoice[]>;
  save(invoice: VendorInvoice): Promise<VendorInvoice>;
  update(invoice: VendorInvoice): Promise<VendorInvoice>;
  nextInvoiceNumber(tenantId: string): Promise<string>;
  existsByIdempotencyKey(key: string, tenantId: string): Promise<boolean>;
  saveWithOutbox(invoice: VendorInvoice): Promise<VendorInvoice>;
}

export const VENDOR_INVOICE_REPOSITORY = Symbol('VendorInvoiceRepository');
