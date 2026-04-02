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
  CreateJournalEntryDto,
  CreateJournalEntryDtoType,
  PostJournalEntryDto,
} from '../dto/finance.dto';
import {
  CreateJournalEntryUseCase,
  PostJournalEntryUseCase,
} from '../../application/use-cases';
import {
  JournalEntryRepository,
  JOURNAL_ENTRY_REPOSITORY,
} from '../../domain/repositories/journal-entry.repository';

@ApiTags('Journal Entries')
@ApiBearerAuth()
@Controller('api/v1/finance/journals')
export class JournalEntryController {
  constructor(
    private readonly createJournalEntry: CreateJournalEntryUseCase,
    private readonly postJournalEntry: PostJournalEntryUseCase,
    @Inject(JOURNAL_ENTRY_REPOSITORY)
    private readonly journalEntryRepo: JournalEntryRepository,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateJournalEntryDto))
  @ApiOperation({ summary: 'Create a new journal entry (draft)' })
  async create(
    @Body() dto: CreateJournalEntryDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.createJournalEntry.execute({
      date: new Date(dto.date),
      description: dto.description,
      lines: dto.lines,
      fiscalYear: dto.fiscalYear,
      fiscalMonth: dto.fiscalMonth,
      tenantId,
      createdBy: user.userId,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post a draft journal entry (makes it immutable)' })
  async post(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    await this.postJournalEntry.execute({ entryId: id, tenantId });
    return { message: 'Journal entry posted successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List journal entries for current tenant' })
  async list(@TenantId() tenantId: string) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const entries = await this.journalEntryRepo.findByPeriod(currentYear, currentMonth, tenantId);
    return { data: entries, total: entries.length, page: 1, pageSize: entries.length, totalPages: 1 };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const entry = await this.journalEntryRepo.findById(id, tenantId);
    if (!entry) {
      return { statusCode: 404, message: 'Journal entry not found' };
    }
    return entry;
  }
}
