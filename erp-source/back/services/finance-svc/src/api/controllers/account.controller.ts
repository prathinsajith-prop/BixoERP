import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import { CreateAccountDto, CreateAccountDtoType } from '../dto/finance.dto';
import {
  Account,
  AccountType,
  NormalBalance,
} from '../../domain/entities/account.entity';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../domain/repositories/account.repository';
import { DuplicateEntryException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Chart of Accounts')
@ApiBearerAuth()
@Controller('api/v1/finance/accounts')
export class AccountController {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateAccountDto))
  @ApiOperation({ summary: 'Create a new account in the Chart of Accounts' })
  async create(
    @Body() dto: CreateAccountDtoType,
    @TenantId() tenantId: string,
  ) {
    const exists = await this.accountRepo.existsByCode(dto.code, tenantId);
    if (exists) {
      throw new DuplicateEntryException('account code', dto.code);
    }

    const accountType = dto.type as AccountType;
    const account = Account.create({
      code: dto.code,
      name: dto.name,
      type: accountType,
      normalBalance: Account.normalBalanceFor(accountType),
      parentId: dto.parentId ?? null,
      groupId: dto.groupId ?? null,
      tenantId,
      description: dto.description ?? null,
    });

    const saved = await this.accountRepo.save(account);
    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      type: saved.type,
      normalBalance: saved.normalBalance,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all accounts (Chart of Accounts)' })
  async list(@TenantId() tenantId: string) {
    return this.accountRepo.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.accountRepo.findById(id, tenantId);
  }
}
