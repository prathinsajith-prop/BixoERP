import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TenantId, UserTenantId, CurrentUser } from '../decorator/auth.decorators';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import { UpdateSettingsDto } from '../dto/settings.dto';
import { PostgresUserSettingsRepository } from '../../infrastructure/persistence/repository/postgres-user-settings.repository';
import { DEFAULT_SETTINGS } from '../../domain/entity/user-settings';

@Controller('api/v1/auth/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsRepo: PostgresUserSettingsRepository,
  ) { }

  @Get()
  async getSettings(
    @UserTenantId() homeTenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const settings = await this.settingsRepo.findByUserId(homeTenantId, user.sub);
    return { statusCode: 200, data: settings };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Body(new ZodValidationPipe(UpdateSettingsDto)) dto: UpdateSettingsDto,
    @UserTenantId() homeTenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const settings = await this.settingsRepo.upsert(homeTenantId, user.sub, dto as Record<string, unknown>);
    return { statusCode: 200, data: settings };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetSettings(
    @UserTenantId() homeTenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.settingsRepo.deleteByUserId(homeTenantId, user.sub);
    return { statusCode: 200, data: DEFAULT_SETTINGS };
  }
}
