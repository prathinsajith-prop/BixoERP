import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }
    const headerTenantId = request.headers['x-tenant-id'];
    if (headerTenantId) {
      return headerTenantId;
    }
    throw new Error('Tenant ID not found in request. JWT must contain tenant_id.');
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
