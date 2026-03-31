import type { AuditFields, Money } from "./common";

// ─── AP / AR ─────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "void";

export interface Invoice extends AuditFields {
  id: string;
  invoiceNumber: string;
  type: "receivable" | "payable";
  status: InvoiceStatus;
  contactId: string;
  contactName: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: Money;
  taxAmount: Money;
  totalAmount: Money;
  amountPaid: Money;
  amountDue: Money;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  taxCode: string;
  taxRate: number;
  lineTotal: Money;
}

export interface Payment extends AuditFields {
  id: string;
  paymentNumber: string;
  type: "incoming" | "outgoing";
  invoiceId: string;
  amount: Money;
  paymentDate: string;
  method: "bank_transfer" | "check" | "cash" | "credit_card";
  reference: string;
}
