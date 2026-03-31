import {
  Controller,
  Get,
  Post,
  Put,
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
  CreateCustomerDto,
  CreateCustomerDtoType,
  UpdateCustomerDto,
  UpdateCustomerDtoType,
} from '../dto/sales.dto';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';
import {
  EntityNotFoundException,
  DuplicateEntryException,
} from '../../domain/exceptions/domain.exceptions';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('api/v1/sales/customers')
export class CustomerController {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: CustomerRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateCustomerDto))
  @ApiOperation({ summary: 'Create a new customer' })
  async create(
    @Body() dto: CreateCustomerDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const emailExists = await this.customerRepo.existsByEmail(dto.email, tenantId);
    if (emailExists) {
      throw new DuplicateEntryException('email', dto.email);
    }

    const customerNumber = await this.customerRepo.nextCustomerNumber(tenantId);

    const customer = Customer.create({
      customerNumber,
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      billingAddress: dto.billingAddress ?? null,
      shippingAddress: dto.shippingAddress ?? null,
      taxId: dto.taxId ?? null,
      creditLimit: dto.creditLimit ?? 0,
      currency: dto.currency,
      tenantId,
      createdBy: user.userId,
    });

    const saved = await this.customerRepo.save(customer);

    return {
      id: saved.id,
      customerNumber: saved.customerNumber,
      name: saved.name,
      email: saved.email,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a customer' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCustomerDto)) dto: UpdateCustomerDtoType,
    @TenantId() tenantId: string,
  ) {
    const customer = await this.customerRepo.findById(id, tenantId);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }

    customer.update(dto);
    const saved = await this.customerRepo.save(customer);

    return {
      id: saved.id,
      customerNumber: saved.customerNumber,
      name: saved.name,
      email: saved.email,
    };
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a customer' })
  async deactivate(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const customer = await this.customerRepo.findById(id, tenantId);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
    customer.deactivate();
    await this.customerRepo.save(customer);
    return { message: 'Customer deactivated' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const customer = await this.customerRepo.findById(id, tenantId);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
    return {
      id: customer.id,
      customerNumber: customer.customerNumber,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      taxId: customer.taxId,
      creditLimit: customer.creditLimit,
      currency: customer.currency,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  async findAll(@TenantId() tenantId: string) {
    const customers = await this.customerRepo.findActive(tenantId);
    return customers.map((c) => ({
      id: c.id,
      customerNumber: c.customerNumber,
      name: c.name,
      email: c.email,
      isActive: c.isActive,
      currency: c.currency,
    }));
  }
}
