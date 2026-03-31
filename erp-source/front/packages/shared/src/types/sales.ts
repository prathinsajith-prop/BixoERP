import type { AuditFields, Money } from "./common";

// ─── Sales ───────────────────────────────────

export type SalesOrderStatus = "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Customer extends AuditFields {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: Money;
  paymentTerms: string;
  isActive: boolean;
}

export interface SalesOrder extends AuditFields {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: SalesOrderStatus;
  orderDate: string;
  deliveryDate: string;
  lines: SalesOrderLine[];
  subtotal: Money;
  taxAmount: Money;
  totalAmount: Money;
}

export interface SalesOrderLine {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: Money;
  discount: number;
  lineTotal: Money;
}
