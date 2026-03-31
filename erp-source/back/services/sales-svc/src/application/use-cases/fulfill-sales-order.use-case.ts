import { Inject, Injectable } from '@nestjs/common';
import {
  SalesOrderRepository,
  SALES_ORDER_REPOSITORY,
} from '../../domain/repositories/sales-order.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { SearchPort, SEARCH_PORT } from '../ports/search.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface FulfillSalesOrderInput {
  orderId: string;
  tenantId: string;
}

export interface FulfillSalesOrderOutput {
  id: string;
  orderNumber: string;
  status: string;
  fulfilledAt: string;
}

@Injectable()
export class FulfillSalesOrderUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly orderRepo: SalesOrderRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    @Inject(SEARCH_PORT)
    private readonly search: SearchPort,
  ) {}

  async execute(input: FulfillSalesOrderInput): Promise<FulfillSalesOrderOutput> {
    const order = await this.orderRepo.findById(input.orderId, input.tenantId);
    if (!order) {
      throw new EntityNotFoundException('SalesOrder', input.orderId);
    }

    // Domain rule: cannot fulfill an unconfirmed order
    order.fulfill();

    const saved = await this.orderRepo.saveWithOutbox(order);

    // Update search index with fulfilled status
    await this.search.indexOrder({
      id: saved.id,
      orderNumber: saved.orderNumber,
      customerId: saved.customerId,
      customerName: saved.customerName,
      status: saved.status,
      totalAmount: saved.totalAmount.amount,
      currency: saved.currency,
      lines: saved.lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
      })),
      tenantId: saved.tenantId,
      confirmedAt: saved.confirmedAt?.toISOString() ?? null,
      createdAt: saved.createdAt.toISOString(),
    });

    await this.cache.delByPattern(`orders:${input.tenantId}:*`);

    // sales.order.fulfilled → notification-svc, report-svc
    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      fulfilledAt: saved.fulfilledAt!.toISOString(),
    };
  }
}
