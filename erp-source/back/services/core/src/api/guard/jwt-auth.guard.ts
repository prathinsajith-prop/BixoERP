import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { TOKEN_SERVICE, TokenService } from '../../application/port/token-service.port';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      // jti is already in the verified payload — no need to manually decode again
      if (payload.jti && await this.tokenService.isBlacklisted(payload.jti)) {
        throw new UnauthorizedException('Token has been revoked');
      }

      request.user = payload;
      request.tenantId = payload.tenantId;
      return true;
    } catch (err) {
      throw new UnauthorizedException((err as Error).message || 'Invalid token');
    }
  }
}
