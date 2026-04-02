import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Inject,
    NotFoundException,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../decorators/tenant.decorator';
import {
    FiscalPeriodRepository,
    FISCAL_PERIOD_REPOSITORY,
} from '../../domain/repositories/fiscal-period.repository';

@ApiTags('Fiscal Periods')
@ApiBearerAuth()
@Controller('api/v1/finance/periods')
export class FiscalPeriodController {
    constructor(
        @Inject(FISCAL_PERIOD_REPOSITORY)
        private readonly periodRepo: FiscalPeriodRepository,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List fiscal periods for current tenant' })
    async list(@TenantId() tenantId: string) {
        const periods = await this.periodRepo.findAll(tenantId);
        const data = periods.map((p) => ({
            id: p.id,
            name: p.name,
            startDate: p.startDate,
            endDate: p.endDate,
            status: p.status.toLowerCase().replace('_', '-') as 'open' | 'soft-closed' | 'hard-closed',
        }));
        return { data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }

    @Post(':id/close')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Close a fiscal period (soft or hard)' })
    async close(
        @Param('id') id: string,
        @Body() body: { type: 'soft' | 'hard' },
        @TenantId() tenantId: string,
    ) {
        const period = await this.periodRepo.findById(id, tenantId);
        if (!period) throw new NotFoundException('Fiscal period not found');
        period.close(body.type);
        await this.periodRepo.update(period);
        return { message: 'Period closed successfully' };
    }
}
