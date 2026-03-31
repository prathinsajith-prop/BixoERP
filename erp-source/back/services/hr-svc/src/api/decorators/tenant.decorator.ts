import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extract tenant_id from the JWT (injected by API Gateway as X-Tenant-ID header) */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Primary: from JWT payload (set by auth middleware)
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }
    // Fallback: from gateway header
    const headerTenantId = request.headers['x-tenant-id'];
    if (headerTenantId) {
      return headerTenantId;
    }
    throw new Error('Tenant ID not found in request. JWT must contain tenant_id.');
  },
);

/** Extract current user from JWT */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
