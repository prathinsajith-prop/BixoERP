import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreatePaymentRunDto,
  CreatePaymentRunDtoType,
} from '../dto/apar.dto';
import { ExecutePaymentRunUseCase } from '../../application/use-cases/execute-payment-run.use-case';
import {
  PaymentRunRepository,
  PAYMENT_RUN_REPOSITORY,
} from '../../domain/repositories/payment-run.repository';
import { PaymentMethod } from '../../domain/entities/payment-run.entity';

@ApiTags('Payment Runs')
@ApiBearerAuth()
@Controller('api/v1/apar/payment-runs')
export class PaymentRunController {
  constructor(
    private readonly executePaymentRun: ExecutePaymentRunUseCase,
    @Inject(PAYMENT_RUN_REPOSITORY)
    private readonly paymentRunRepo: PaymentRunRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreatePaymentRunDto))
  @ApiOperation({ summary: 'Create a new payment run' })
  async create(
    @Body() dto: CreatePaymentRunDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.executePaymentRun.execute({
      description: dto.description,
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod as PaymentMethod,
      currency: dto.currency,
      bankAccountId: dto.bankAccountId,
      vendorInvoiceIds: dto.vendorInvoiceIds,
      tenantId,
      createdBy: user.userId,
    });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve and execute a payment run' })
  async approve(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.executePaymentRun.approveAndProcess(id, user.userId, tenantId);
    return { message: 'Payment run approved and processed' };
  }

  @Get()
  @ApiOperation({ summary: 'List payment runs' })
  async list(@TenantId() tenantId: string) {
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment run by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const run = await this.paymentRunRepo.findById(id, tenantId);
    if (!run) {
      return { statusCode: 404, message: 'Payment run not found' };
    }
    return run;
  }
}
