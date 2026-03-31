import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UsePipes,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import { CreateInvoiceDto, CreateInvoiceDtoType, ApplyPaymentDto } from '../dto/finance.dto';
import { PostInvoiceUseCase } from '../../application/use-cases/post-invoice.use-case';
import {
  InvoiceRepository,
  INVOICE_REPOSITORY,
} from '../../domain/repositories/invoice.repository';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('api/v1/finance/invoices')
export class InvoiceController {
  constructor(
    private readonly postInvoice: PostInvoiceUseCase,
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepo: InvoiceRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateInvoiceDto))
  @ApiOperation({ summary: 'Create and send an invoice' })
  async create(
    @Body() dto: CreateInvoiceDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.postInvoice.createAndSend({
      customerId: dto.customerId,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      currency: dto.currency,
      lines: dto.lines.map((l) => ({
        ...l,
        taxCode: l.taxCode ?? null,
      })),
      notes: dto.notes ?? null,
      tenantId,
      createdBy: user.userId,
    });
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a payment to an invoice' })
  async applyPayment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApplyPaymentDto))
    dto: { invoiceId: string; amount: number; currency: string },
    @TenantId() tenantId: string,
  ) {
    await this.postInvoice.applyPayment(id, dto.amount, dto.currency, tenantId);
    return { message: 'Payment applied successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  async list(@TenantId() tenantId: string) {
    // TODO: pagination, filtering
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.invoiceRepo.findById(id, tenantId);
  }
}
