import { z } from 'zod';

export const CreateJournalEntryDto = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalMonth: z.number().int().min(1).max(12),
  idempotencyKey: z.string().max(64).optional(),
  lines: z
    .array(
      z.object({
        accountId: z.string().uuid(),
        description: z.string().min(1).max(500),
        debitAmount: z.number().min(0),
        creditAmount: z.number().min(0),
        currency: z.string().length(3),
        exchangeRate: z.number().positive(),
      }),
    )
    .min(2, 'A journal entry must have at least 2 lines'),
});

export type CreateJournalEntryDtoType = z.infer<typeof CreateJournalEntryDto>;

export const PostJournalEntryDto = z.object({
  entryId: z.string().uuid(),
});

export const CreateInvoiceDto = z.object({
  customerId: z.string().uuid(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3),
  notes: z.string().max(1000).nullable().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
        taxCode: z.string().max(20).nullable().optional(),
        taxRate: z.number().min(0).max(100),
        accountId: z.string().uuid(),
      }),
    )
    .min(1),
});

export type CreateInvoiceDtoType = z.infer<typeof CreateInvoiceDto>;

export const ApplyPaymentDto = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
});

export const CreateAccountDto = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().uuid().nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type CreateAccountDtoType = z.infer<typeof CreateAccountDto>;
