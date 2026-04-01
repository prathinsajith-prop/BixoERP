import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ScopeTokenDto,
} from '../dto/auth.dto';
import { RegisterUserUseCase } from '../../application/use-case/register-user.use-case';
import { LoginUseCase } from '../../application/use-case/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-case/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-case/logout.use-case';
import { ChangePasswordUseCase } from '../../application/use-case/change-password.use-case';
import { PasswordResetUseCase } from '../../application/use-case/password-reset.use-case';
import { TwoFactorUseCase } from '../../application/use-case/two-factor.use-case';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TenantId, CurrentUser } from '../decorator/auth.decorators';
import { TOKEN_SERVICE, TokenService, AccessTokenPayload } from '../../application/port/token-service.port';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly passwordResetUseCase: PasswordResetUseCase,
    private readonly twoFactorUseCase: TwoFactorUseCase,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) { }

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterDto)) dto: RegisterDto,
    @TenantId() tenantId: string,
  ) {
    const result = await this.registerUser.execute({
      tenantId,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return { statusCode: 201, data: result };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginDto)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const result = await this.loginUseCase.execute({
      tenantId,
      email: dto.email,
      password: dto.password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // If 2FA is enabled, don't issue tokens yet — return a pending challenge
    if (result.twoFactorRequired) {
      return {
        statusCode: 200,
        data: {
          twoFactorRequired: true,
          twoFactorToken: result.twoFactorToken,
          tenantId: result.tenantId,
        },
      };
    }

    // Set the refresh token as an HttpOnly, Secure, SameSite=Strict cookie.
    // This makes it inaccessible to JavaScript — immune to XSS token theft.
    if (result.refreshToken) {
      res.cookie('__erp_rt', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',       // scoped: only sent to auth endpoints
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
      });
    }

    // Never send the refresh token in the response body
    return {
      statusCode: 200,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tenantId: result.tenantId,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Read refresh token exclusively from the HttpOnly cookie — never from body.
    // This prevents any client-side script (XSS) from injecting a forged token.
    const refreshToken: string | undefined = req.cookies?.['__erp_rt'];
    if (!refreshToken) {
      res.status(401).json({ statusCode: 401, message: 'No refresh token' });
      return;
    }

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Re-issue the cookie with the rotated refresh token
    res.cookie('__erp_rt', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      statusCode: 200,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string | undefined = req.cookies?.['__erp_rt'];
    await this.logoutUseCase.execute({
      tenantId,
      userId: user.sub,
      refreshToken,
    });
    // Immediately expire the cookie
    res.clearCookie('__erp_rt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body(new ZodValidationPipe(ChangePasswordDto)) dto: ChangePasswordDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    await this.changePasswordUseCase.execute({
      tenantId,
      userId: user.sub,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body(new ZodValidationPipe(RequestPasswordResetDto)) dto: RequestPasswordResetDto,
    @TenantId() tenantId: string,
  ) {
    await this.passwordResetUseCase.requestReset({
      tenantId,
      email: dto.email,
    });
    return { statusCode: 200, message: 'If the email exists, a reset link has been sent' };
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordDto)) dto: ResetPasswordDto,
    @TenantId() tenantId: string,
  ) {
    await this.passwordResetUseCase.resetPassword({
      tenantId,
      token: dto.token,
      newPassword: dto.newPassword,
    });
  }

  @Post('scope-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async scopeToken(
    @Body(new ZodValidationPipe(ScopeTokenDto)) dto: ScopeTokenDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const scopedPermissions = user.permissions.filter(
      (p) => p.startsWith(`${dto.module}:`),
    );

    const scopedToken = this.tokenService.generateAccessToken({
      sub: user.sub,
      tenantId: user.tenantId,
      email: user.email,
      roles: user.roles,
      permissions: scopedPermissions,
    });

    return {
      statusCode: 200,
      data: {
        accessToken: scopedToken,
        module: dto.module,
        permissions: scopedPermissions,
      },
    };
  }
}
