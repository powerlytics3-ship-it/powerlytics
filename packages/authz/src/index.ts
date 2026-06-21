import { LegacyRole, Role } from "@powerlytic/types";

export const Permission = {
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_MANAGE: "workspace:manage",
  MEMBERSHIP_MANAGE: "membership:manage",
  DEVICE_MODEL_READ: "device_model:read",
  DEVICE_MODEL_MANAGE: "device_model:manage",
  DEVICE_MANUFACTURE: "device:manufacture",
  DEVICE_READ: "device:read",
  DEVICE_MANAGE: "device:manage",
  DEVICE_CLAIM: "device:claim",
  DEVICE_DEPLOY_CONFIG: "device:deploy_config",
  TELEMETRY_READ: "telemetry:read",
  TELEMETRY_INGEST: "telemetry:ingest",
  ALERT_MANAGE: "alert:manage",
  ACTUATION_CREATE: "actuation:create",
  ACTUATION_APPROVE: "actuation:approve",
  AUDIT_READ: "audit:read"
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ENGINEERING_ADMIN]: [
    Permission.DEVICE_MODEL_READ,
    Permission.DEVICE_MODEL_MANAGE,
    Permission.DEVICE_MANUFACTURE,
    Permission.DEVICE_READ,
    Permission.DEVICE_MANAGE,
    Permission.DEVICE_DEPLOY_CONFIG,
    Permission.TELEMETRY_READ,
    Permission.AUDIT_READ
  ],
  [Role.MANUFACTURER]: [
    Permission.DEVICE_MODEL_READ,
    Permission.DEVICE_MANUFACTURE,
    Permission.DEVICE_READ
  ],
  [Role.WORKSPACE_ADMIN]: [
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_MANAGE,
    Permission.MEMBERSHIP_MANAGE,
    Permission.DEVICE_MODEL_READ,
    Permission.DEVICE_READ,
    Permission.DEVICE_MANAGE,
    Permission.DEVICE_CLAIM,
    Permission.DEVICE_DEPLOY_CONFIG,
    Permission.TELEMETRY_READ,
    Permission.ALERT_MANAGE,
    Permission.ACTUATION_CREATE,
    Permission.ACTUATION_APPROVE,
    Permission.AUDIT_READ
  ],
  [Role.OPERATOR]: [
    Permission.WORKSPACE_READ,
    Permission.DEVICE_MODEL_READ,
    Permission.DEVICE_READ,
    Permission.TELEMETRY_READ,
    Permission.ACTUATION_CREATE
  ],
  [Role.VIEWER]: [
    Permission.WORKSPACE_READ,
    Permission.DEVICE_MODEL_READ,
    Permission.DEVICE_READ,
    Permission.TELEMETRY_READ
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} cannot perform ${permission}`);
  }
}

export function mapLegacyRole(role: LegacyRole): Role {
  switch (role) {
    case LegacyRole.CompanyAdmin:
      return Role.SUPER_ADMIN;
    case LegacyRole.OrgAdmin:
      return Role.WORKSPACE_ADMIN;
    case LegacyRole.OrgUser:
      return Role.OPERATOR;
    default:
      return Role.VIEWER;
  }
}
