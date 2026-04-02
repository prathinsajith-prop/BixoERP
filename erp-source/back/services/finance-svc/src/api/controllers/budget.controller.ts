import {
    Controller,
    Get,
    Param,
    Inject,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../decorators/tenant.decorator';
import {
    BudgetRepository,
    BUDGET_REPOSITORY,
} from '../../domain/repositories/budget.repository';

@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('api/v1/finance/budgets')
export class BudgetController {
    constructor(
        @Inject(BUDGET_REPOSITORY)
        private readonly budgetRepo: BudgetRepository,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List budgets for current tenant' })
    async list(@TenantId() tenantId: string) {
        const budgets = await this.budgetRepo.findAll(tenantId);
        const data = budgets.map((b) => ({
            id: b.id,
            name: b.name,
            fiscalYear: b.fiscalYear,
            status: b.status.toLowerCase(),
            totalAmount: {
                amount: b.lines.reduce((sum, l) => sum + l.amount.amountAsNumber, 0).toFixed(4),
                currency: b.lines[0]?.amount.currency ?? 'USD',
            },
            lines: b.lines.map((l) => ({
                id: l.id,
                accountId: l.accountId,
                period: l.period,
                budgetedAmount: { amount: l.amount.amount, currency: l.amount.currency },
                actualAmount: { amount: l.actual.amount, currency: l.actual.currency },
                variance: { amount: l.amount.subtract(l.actual).amount, currency: l.amount.currency },
            })),
        }));
        return { data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get budget by ID' })
    async findById(@Param('id') id: string, @TenantId() tenantId: string) {
        const budget = await this.budgetRepo.findById(id, tenantId);
        if (!budget) throw new NotFoundException('Budget not found');
        return budget;
    }
}
