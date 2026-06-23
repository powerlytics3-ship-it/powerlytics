import { Permission, hasPermission as hasRolePermission } from "@powerlytic/authz";
import { Role } from "@powerlytic/types";

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  return userRoles.some((role) => hasRolePermission(role, permission));
}

/**
 * Check if a route is protected
 */
export function isProtectedPath(pathname: string): boolean {
  const publicPaths = ["/", "/login", "/auth", "/forbidden", "/api/auth"];
  return !publicPaths.some(path => pathname.startsWith(path));
}

/**
 * Get required permission for a path
 */
export function getRequiredPermission(pathname: string): Permission | null {
  const pathPermissions: Record<string, Permission> = {
    "/dashboard": Permission.WORKSPACE_READ,
    "/devices": Permission.DEVICE_READ,
    "/devices/new": Permission.DEVICE_MANAGE,
    "/device-models": Permission.DEVICE_MODEL_READ,
    "/users": Permission.MEMBERSHIP_MANAGE,
    "/organizations": Permission.WORKSPACE_MANAGE,
    "/settings": Permission.WORKSPACE_MANAGE,
    "/alerts": Permission.TELEMETRY_READ,
    "/telemetry": Permission.TELEMETRY_READ,
    "/audit": Permission.AUDIT_READ
  };

  // Check exact match first
  if (pathPermissions[pathname]) {
    return pathPermissions[pathname];
  }

  // Check prefix matches
  for (const [path, perm] of Object.entries(pathPermissions)) {
    if (pathname.startsWith(path)) {
      return perm;
    }
  }

  return null;
}

/**
 * Check if user can access a specific path
 */
export function canAccessPath(userRoles: Role[], pathname: string): boolean {
  const requiredPermission = getRequiredPermission(pathname);
  if (!requiredPermission) {
    return true; // No specific permission required
  }
  return hasPermission(userRoles, requiredPermission);
}
