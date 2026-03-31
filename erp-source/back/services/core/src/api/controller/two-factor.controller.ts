import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TenantId, CurrentUser } from '../decorator/auth.decorators';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import {
  VerifySetupDto,
  ValidateTwoFactorDto,
  DisableTwoFactorDto,
  RegenerateCodesDto,
} from '../dto/two-factor.dto';
import { TwoFactorUseCase } from '../../application/use-case/two-factor.use-case';

@Controller('api/v1/auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorUseCase: TwoFactorUseCase) {}

  /**
   * GET /2fa/status — Check if 2FA is enabled for current user.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const enabled = await this.twoFactorUseCase.isEnabled(tenantId, user.sub);
    return { statusCode: 200, data: { enabled } };
  }

  /**
   * POST /2fa/setup — Generate TOTP secret + QR code.
   * Requires authentication. Does NOT enable 2FA yet.
   */
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.twoFactorUseCase.setup(tenantId, user.sub);
    return { statusCode: 200, data: result };
  }

  /**
   * POST /2fa/verify-setup — Confirm setup by providing TOTP code from authenticator app.
   * Returns one-time recovery codes.
   */
  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async verifySetup(
    @Body(new ZodValidationPipe(VerifySetupDto)) dto: VerifySetupDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.twoFactorUseCase.verifySetup(tenantId, user.sub, dto.totpCode);
    return { statusCode: 200, data: result };
  }

  /**
   * POST /2fa/validate — Login step 2: provide TOTP code (or recovery code) to complete login.
   * No auth guard needed — uses the temporary twoFactorToken from the login response.
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(
    @Body(new ZodValidationPipe(ValidateTwoFactorDto)) dto: ValidateTwoFactorDto,
    @TenantId() tenantId: string,
    @Req() req: Request,
  ) {
    const result = await this.twoFactorUseCase.validate(
      dto.twoFactorToken,
      dto.code,
      req.headers['user-agent'],
      req.ip,
    );
    return { statusCode: 200, data: result };
  }

  /**
   * POST /2fa/disable — Disable 2FA. Requires TOTP or recovery code.
   */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async disable(
    @Body(new ZodValidationPipe(DisableTwoFactorDto)) dto: DisableTwoFactorDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.twoFactorUseCase.disable(tenantId, user.sub, dto.code);
    return { statusCode: 200, data: { message: 'Two-factor authentication disabled' } };
  }

  /**
   * POST /2fa/regenerate-codes — Regenerate recovery codes. Requires TOTP verification.
   */
  @Post('regenerate-codes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async regenerateCodes(
    @Body(new ZodValidationPipe(RegenerateCodesDto)) dto: RegenerateCodesDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const codes = await this.twoFactorUseCase.regenerateRecoveryCodes(
      tenantId,
      user.sub,
      dto.totpCode,
    );
    return { statusCode: 200, data: { recoveryCodes: codes } };
  }
}
