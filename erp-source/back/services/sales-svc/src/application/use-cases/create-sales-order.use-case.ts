import { Inject, Injectable } from '@nestjs/common';
import { SalesOrder } from '../../domain/entities/sales-order.entity';
import {
  SalesOrderRepository,
  SALES_ORDER_REPOSITORY,
} from '../../domain/repositories/sales-order.repository';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface CreateSalesOrderInput {
  customerId: string;
  lines: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
  currency: string;
  taxRate: number;
  notes: string | null;
  quotationId: string | null;
  tenantId: string;
  createdBy: string;
}

export interface CreateSalesOrderOutput {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
}

@Injectable()
export class CreateSalesOrderUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly orderRepo: SalesOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: CreateSalesOrderInput): Promise<CreateSalesOrderOutput> {
    // Validate customer exists
    const customer = await this.customerRepo.findById(input.customerId, input.tenantId);
    if (!customer) {
      throw new EntityNotFoundException('Customer', input.customerId);
    }

    const orderNumber = await this.orderRepo.nextOrderNumber(input.tenantId);

    const order = SalesOrder.create({
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      lines: input.lines,
      currency: input.currency,
      taxRate: input.taxRate,
      notes: input.notes,
      quotationId: input.quotationId,
      tenantId: input.tenantId,
      createdBy: input.createdBy,
    });

    const saved = await this.orderRepo.saveWithOutbox(order);

    await this.cache.delByPattern(`orders:${input.tenantId}:*`);

    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      totalAmount: saved.totalAmount.amount,
      currency: saved.currency,
    };
  }
}
