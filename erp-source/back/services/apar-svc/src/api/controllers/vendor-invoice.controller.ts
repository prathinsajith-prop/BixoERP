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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreateVendorInvoiceDto,
  CreateVendorInvoiceDtoType,
  ThreeWayMatchDto,
  ThreeWayMatchDtoType,
} from '../dto/apar.dto';
import { ProcessVendorInvoiceUseCase } from '../../application/use-cases/process-vendor-invoice.use-case';
import { ThreeWayMatchUseCase } from '../../application/use-cases/three-way-match.use-case';
import {
  VendorInvoiceRepository,
  VENDOR_INVOICE_REPOSITORY,
} from '../../domain/repositories/vendor-invoice.repository';

@ApiTags('Vendor Invoices')
@ApiBearerAuth()
@Controller('api/v1/apar/vendor-invoices')
export class VendorInvoiceController {
  constructor(
    private readonly processInvoice: ProcessVendorInvoiceUseCase,
    private readonly threeWayMatch: ThreeWayMatchUseCase,
    @Inject(VENDOR_INVOICE_REPOSITORY)
    private readonly invoiceRepo: VendorInvoiceRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateVendorInvoiceDto))
  @ApiOperation({ summary: 'Create a new vendor invoice' })
  async create(
    @Body() dto: CreateVendorInvoiceDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.processInvoice.execute({
      vendorId: dto.vendorId,
      vendorInvoiceRef: dto.vendorInvoiceRef,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      currency: dto.currency,
      paymentTermsCode: dto.paymentTermsCode,
      purchaseOrderId: dto.purchaseOrderId ?? null,
      goodsReceiptId: dto.goodsReceiptId ?? null,
      lines: dto.lines.map((l) => ({
        ...l,
        taxCode: l.taxCode ?? null,
        purchaseOrderLineId: l.purchaseOrderLineId ?? null,
      })),
      notes: dto.notes ?? null,
      tenantId,
      createdBy: user.userId,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a vendor invoice for payment' })
  async approve(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) {
      return { statusCode: 404, message: 'Vendor invoice not found' };
    }
    invoice.approve();
    await this.invoiceRepo.saveWithOutbox(invoice);
    return { message: 'Vendor invoice approved', status: invoice.status };
  }

  @Post('three-way-match')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ThreeWayMatchDto))
  @ApiOperation({ summary: 'Execute 3-way match (PO + Receipt + Invoice)' })
  async executeThreeWayMatch(
    @Body() dto: ThreeWayMatchDtoType,
    @TenantId() tenantId: string,
  ) {
    return this.threeWayMatch.execute({
      vendorInvoiceId: dto.vendorInvoiceId,
      tenantId,
      purchaseOrder: dto.purchaseOrder,
      goodsReceipt: dto.goodsReceipt,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List vendor invoices' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  async list(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    if (vendorId) {
      return this.invoiceRepo.findByVendor(vendorId, tenantId);
    }
    if (status) {
      return this.invoiceRepo.findByStatus(status, tenantId);
    }
    return [];
  }

  @Get('overdue')
  @ApiOperation({ summary: 'List overdue vendor invoices' })
  async listOverdue(@TenantId() tenantId: string) {
    return this.invoiceRepo.findOverdue(tenantId);
  }

  @Get('aging')
  @ApiOperation({ summary: 'Get AP aging summary (30/60/90 days)' })
  async agingSummary(@TenantId() tenantId: string) {
    const overdue = await this.invoiceRepo.findOverdue(tenantId);
    const buckets = {
      current: { count: 0, total: '0.0000' },
      '1-30': { count: 0, total: '0.0000' },
      '31-60': { count: 0, total: '0.0000' },
      '61-90': { count: 0, total: '0.0000' },
      '90+': { count: 0, total: '0.0000' },
    };

    for (const inv of overdue) {
      const bucket = inv.agingBucket;
      const key = bucket === 'CURRENT' ? 'current' : bucket;
      if (key in buckets) {
        const b = buckets[key as keyof typeof buckets];
        b.count += 1;
        b.total = (parseFloat(b.total) + inv.balance.amountAsNumber).toFixed(4);
      }
    }

    return { tenantId, buckets };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor invoice by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) {
      return { statusCode: 404, message: 'Vendor invoice not found' };
    }
    return invoice;
  }
}
