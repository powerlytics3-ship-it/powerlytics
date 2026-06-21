import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission, Permission } from "@powerlytic/authz";
import { Role } from "@powerlytic/types";
import { REQUIRED_PERMISSION } from "./require-permission.decorator.js";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission | undefined>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{ user?: { roles?: Role[] } }>();
    if ((request.user as { authType?: string } | undefined)?.authType === "device" && required === Permission.TELEMETRY_INGEST) {
      return true;
    }
    const roles = request.user?.roles ?? [];
    if (roles.some((role) => hasPermission(role, required))) return true;
    throw new ForbiddenException(`Missing permission ${required}`);
  }
}
