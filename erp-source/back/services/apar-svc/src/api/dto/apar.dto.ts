import { z } from 'zod';

// ── Vendor Invoice DTOs ────────────────────────────────────

export const CreateVendorInvoiceDto = z.object({
  vendorId: z.string().uuid(),
  vendorInvoiceRef: z.string().min(1).max(100),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3),
  paymentTermsCode: z.string().min(1).max(30),
  purchaseOrderId: z.string().uuid().nullable().optional(),
  goodsReceiptId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  idempotencyKey: z.string().max(64).optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
        taxCode: z.string().max(20).nullable().optional(),
        taxRate: z.number().min(0).max(100),
        accountId: z.string().uuid(),
        purchaseOrderLineId: z.string().uuid().nullable().optional(),
      }),
    )
    .min(1),
});

export type CreateVendorInvoiceDtoType = z.infer<typeof CreateVendorInvoiceDto>;

export const ApproveVendorInvoiceDto = z.object({
  invoiceId: z.string().uuid(),
});

// ── Payment Run DTOs ───────────────────────────────────────

export const CreatePaymentRunDto = z.object({
  description: z.string().min(1).max(500),
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHECK', 'ACH', 'WIRE']),
  currency: z.string().length(3),
  bankAccountId: z.string().uuid(),
  vendorInvoiceIds: z.array(z.string().uuid()).min(1),
});

export type CreatePaymentRunDtoType = z.infer<typeof CreatePaymentRunDto>;

export const ApprovePaymentRunDto = z.object({
  paymentRunId: z.string().uuid(),
});

// ── 3-Way Match DTO ────────────────────────────────────────

export const ThreeWayMatchDto = z.object({
  vendorInvoiceId: z.string().uuid(),
  purchaseOrder: z.object({
    poNumber: z.string().min(1),
    totalAmount: z.number().min(0),
    currency: z.string().length(3),
    lines: z.array(
      z.object({
        lineId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
      }),
    ),
  }),
  goodsReceipt: z.object({
    receiptNumber: z.string().min(1),
    lines: z.array(
      z.object({
        purchaseOrderLineId: z.string().uuid(),
        quantityReceived: z.number().positive(),
      }),
    ),
  }),
});

export type ThreeWayMatchDtoType = z.infer<typeof ThreeWayMatchDto>;
