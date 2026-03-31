import type { AuditFields, Money } from "./common";

// ─── Procurement ─────────────────────────────

export type POStatus = "draft" | "submitted" | "approved" | "sent" | "partial" | "received" | "closed" | "cancelled";

export interface PurchaseOrder extends AuditFields {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  status: POStatus;
  orderDate: string;
  expectedDate: string;
  lines: PurchaseOrderLine[];
  subtotal: Money;
  taxAmount: Money;
  totalAmount: Money;
}

export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: Money;
  receivedQuantity: number;
  lineTotal: Money;
}

export interface Vendor extends AuditFields {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  isActive: boolean;
}
