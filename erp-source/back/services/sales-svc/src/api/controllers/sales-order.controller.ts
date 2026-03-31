import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreateSalesOrderDto,
  CreateSalesOrderDtoType,
  CancelSalesOrderDto,
  CancelSalesOrderDtoType,
  SearchOrdersDto,
  SearchOrdersDtoType,
} from '../dto/sales.dto';
import {
  CreateSalesOrderUseCase,
  ConfirmSalesOrderUseCase,
  FulfillSalesOrderUseCase,
} from '../../application/use-cases';
import {
  SalesOrderRepository,
  SALES_ORDER_REPOSITORY,
} from '../../domain/repositories/sales-order.repository';
import { SearchPort, SEARCH_PORT } from '../../application/ports/search.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Sales Orders')
@ApiBearerAuth()
@Controller('api/v1/sales/orders')
export class SalesOrderController {
  constructor(
    private readonly createOrder: CreateSalesOrderUseCase,
    private readonly confirmOrder: ConfirmSalesOrderUseCase,
    private readonly fulfillOrder: FulfillSalesOrderUseCase,
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly orderRepo: SalesOrderRepository,
    @Inject(SEARCH_PORT)
    private readonly search: SearchPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateSalesOrderDto))
  @ApiOperation({ summary: 'Create a new sales order' })
  async create(
    @Body() dto: CreateSalesOrderDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.createOrder.execute({
      customerId: dto.customerId,
      lines: dto.lines,
      currency: dto.currency,
      taxRate: dto.taxRate,
      notes: dto.notes ?? null,
      quotationId: dto.quotationId ?? null,
      tenantId,
      createdBy: user.userId,
    });
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a sales order' })
  async confirm(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.confirmOrder.execute({ orderId: id, tenantId });
  }

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fulfill a sales order' })
  async fulfill(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.fulfillOrder.execute({ orderId: id, tenantId });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a sales order' })
  async cancel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelSalesOrderDto)) dto: CancelSalesOrderDtoType,
    @TenantId() tenantId: string,
  ) {
    const order = await this.orderRepo.findById(id, tenantId);
    if (!order) {
      throw new EntityNotFoundException('SalesOrder', id);
    }
    order.cancel(dto.reason);
    await this.orderRepo.saveWithOutbox(order);
    return { message: 'Order cancelled successfully' };
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search sales orders via Elasticsearch' })
  async searchOrders(
    @Query(new ZodValidationPipe(SearchOrdersDto)) dto: SearchOrdersDtoType,
    @TenantId() tenantId: string,
  ) {
    return this.search.searchOrders(dto.query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const order = await this.orderRepo.findById(id, tenantId);
    if (!order) {
      throw new EntityNotFoundException('SalesOrder', id);
    }
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      status: order.status,
      currency: order.currency,
      subtotal: order.subtotal.amount,
      taxRate: order.taxRate,
      taxAmount: order.taxAmount.amount,
      totalAmount: order.totalAmount.amount,
      notes: order.notes,
      quotationId: order.quotationId,
      lines: order.lines.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice.amount,
        discount: l.discount,
        lineTotal: l.lineTotal.amount,
      })),
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt.toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all sales orders' })
  async findAll(@TenantId() tenantId: string) {
    const orders = await this.orderRepo.findAll(tenantId);
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      totalAmount: o.totalAmount.amount,
      currency: o.currency,
      createdAt: o.createdAt.toISOString(),
    }));
  }
}
