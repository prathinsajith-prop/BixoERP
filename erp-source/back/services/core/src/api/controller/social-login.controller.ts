import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import {
  GoogleLoginDto,
  GithubLoginDto,
  MicrosoftLoginDto,
  AppleLoginDto,
} from '../dto/social-login.dto';
import { SocialLoginUseCase } from '../../application/use-case/social-login.use-case';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TenantId, CurrentUser } from '../decorator/auth.decorators';
import { SocialProvider } from '../../domain/entity/social-account.entity';

@Controller('api/v1/auth/social')
export class SocialLoginController {
  constructor(private readonly socialLoginUseCase: SocialLoginUseCase) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(
    @Body(new ZodValidationPipe(GoogleLoginDto)) dto: GoogleLoginDto,
    @Req() req: Request,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const result = await this.socialLoginUseCase.loginWithGoogle(
      tenantId,
      dto.idToken,
      req.headers['user-agent'],
      req.ip,
    );
    return { statusCode: 200, data: result };
  }

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async github(
    @Body(new ZodValidationPipe(GithubLoginDto)) dto: GithubLoginDto,
    @Req() req: Request,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const result = await this.socialLoginUseCase.loginWithGithub(
      tenantId,
      dto.code,
      dto.redirectUri,
      req.headers['user-agent'],
      req.ip,
    );
    return { statusCode: 200, data: result };
  }

  @Post('microsoft')
  @HttpCode(HttpStatus.OK)
  async microsoft(
    @Body(new ZodValidationPipe(MicrosoftLoginDto)) dto: MicrosoftLoginDto,
    @Req() req: Request,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const result = await this.socialLoginUseCase.loginWithMicrosoft(
      tenantId,
      dto.code,
      dto.redirectUri,
      req.headers['user-agent'],
      req.ip,
    );
    return { statusCode: 200, data: result };
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async apple(
    @Body(new ZodValidationPipe(AppleLoginDto)) dto: AppleLoginDto,
    @Req() req: Request,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const result = await this.socialLoginUseCase.loginWithApple(
      tenantId,
      dto.code,
      dto.redirectUri,
      dto.firstName,
      dto.lastName,
      req.headers['user-agent'],
      req.ip,
    );
    return { statusCode: 200, data: result };
  }

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  async listAccounts(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const accounts = await this.socialLoginUseCase.getLinkedAccounts(tenantId, user.sub);
    return { statusCode: 200, data: accounts };
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async unlink(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('provider') provider: string,
  ) {
    const upper = provider.toUpperCase() as SocialProvider;
    if (!Object.values(SocialProvider).includes(upper)) {
      throw new BadRequestException(`Invalid provider: ${provider}`);
    }
    await this.socialLoginUseCase.unlinkAccount(tenantId, user.sub, upper);
  }
}
