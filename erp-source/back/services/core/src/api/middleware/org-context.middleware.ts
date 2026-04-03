import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

export const ORG_CONTEXT_KEY = 'orgContext';

export interface OrgContext {
    orgId: string;
    tenantId: string;
    userId: string;
    membershipId?: string;
    roleId?: string;
    roleName?: string;
    membershipType?: string;
    permissions: string[];
}

/**
 * Extracts the already-verified JWT payload (set by JwtAuthGuard) and
 * stores org context in the CLS store so that any service or repository
 * can access it without receiving it as a parameter.
 *
 * Mount AFTER JwtAuthGuard has run (i.e. the middleware runs globally but
 * reads `request.user` which is populated by the guard on protected routes).
 */
@Injectable()
export class OrgContextMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) { }

    use(req: Request, _res: Response, next: NextFunction): void {
        const user = (req as any).user;
        if (user) {
            const ctx: OrgContext = {
                orgId: user.orgId ?? user.tenantId,
                tenantId: user.tenantId,
                userId: user.sub,
                membershipId: user.membershipId,
                roleId: user.roleId,
                roleName: user.roleName,
                membershipType: user.membershipType,
                permissions: Array.isArray(user.permissions) ? user.permissions : [],
            };
            this.cls.set(ORG_CONTEXT_KEY, ctx);
        }
        next();
    }
}
