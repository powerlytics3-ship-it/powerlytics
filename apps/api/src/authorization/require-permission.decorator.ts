import { SetMetadata } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";

export const REQUIRED_PERMISSION = "requiredPermission";

export function RequirePermission(permission: Permission) {
  return SetMetadata(REQUIRED_PERMISSION, permission);
}
