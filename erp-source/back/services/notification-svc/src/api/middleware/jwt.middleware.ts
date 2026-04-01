import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly secret: string;
  private readonly issuer: string;

  constructor(config: ConfigService) {
    this.secret = config.get<string>('jwt.secret')!;
    this.issuer = config.get<string>('jwt.issuer')!;
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);
    try {
      const payload = this.verifyToken(token);
      (req as any).user = {
        userId: payload.sub,
        tenantId: payload.tenantId || payload.tenant_id,
        orgId: payload.org_id ?? payload.orgId ?? payload.tenantId ?? payload.tenant_id,
        orgRole: payload.org_role ?? payload.orgRole ?? null,
        roles: payload.roles || [],
        email: payload.email,
      };
      next();
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private verifyToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) {
      throw new Error('Invalid JWT signature');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    if (payload.iss && payload.iss !== this.issuer) {
      throw new Error('Invalid JWT issuer');
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }
}
