import { z } from 'zod';

// ── Sales Order DTOs ────────────────────────────────

const OrderLineDto = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
});

export const CreateSalesOrderDto = z.object({
  customerId: z.string().uuid(),
  lines: z.array(OrderLineDto).min(1),
  currency: z.string().length(3),
  taxRate: z.number().min(0).max(100),
  notes: z.string().max(2000).nullable().optional(),
  quotationId: z.string().uuid().nullable().optional(),
});

export type CreateSalesOrderDtoType = z.infer<typeof CreateSalesOrderDto>;

export const CancelSalesOrderDto = z.object({
  reason: z.string().min(1).max(1000),
});

export type CancelSalesOrderDtoType = z.infer<typeof CancelSalesOrderDto>;

export const SearchOrdersDto = z.object({
  query: z.string().min(1).max(500),
});

export type SearchOrdersDtoType = z.infer<typeof SearchOrdersDto>;

// ── Customer DTOs ───────────────────────────────────

export const CreateCustomerDto = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(30).nullable().optional(),
  billingAddress: z.string().max(1000).nullable().optional(),
  shippingAddress: z.string().max(1000).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  creditLimit: z.number().min(0).default(0),
  currency: z.string().length(3),
});

export type CreateCustomerDtoType = z.infer<typeof CreateCustomerDto>;

export const UpdateCustomerDto = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).nullable().optional(),
  billingAddress: z.string().max(1000).nullable().optional(),
  shippingAddress: z.string().max(1000).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  creditLimit: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
});

export type UpdateCustomerDtoType = z.infer<typeof UpdateCustomerDto>;
