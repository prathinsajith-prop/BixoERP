import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declare that a handler requires a specific permission.
 *
 * Accepts either:
 *  - a plain string   → "invoice:approve" or "invoice:approve:department"
 *  - a structured arg → RequirePermission('invoice', 'approve', 'department')
 *
 * Permission codes in the JWT take the form "resource:action:scope"
 * where scope is optional.  A match occurs when jwt_permission starts
 * with the required prefix, so "invoice:approve" matches both
 * "invoice:approve" and "invoice:approve:department".
 */
export const RequirePermissions = (...permissions: string[]) =>
  Reflect.metadata(PERMISSIONS_KEY, permissions);

/** Structured decorator — preferred for readability */
export const RequirePermission = (resource: string, action: string, scope?: string) =>
  RequirePermissions(scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const jwtPerms: string[] = Array.isArray(user.permissions) ? user.permissions : [];

    // For each required permission, check if any JWT permission starts with it
    // (allowing scope-level wildcards: "invoice:approve" covers "invoice:approve:department")
    const missing = required.filter(
      (req) => !jwtPerms.some((p) => p === req || p.startsWith(`${req}:`)),
    );

    if (missing.length > 0) {
      throw new ForbiddenException(`Missing required permissions: ${missing.join(', ')}`);
    }

    return true;
  }
}
