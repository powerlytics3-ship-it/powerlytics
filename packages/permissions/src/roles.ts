export const PlatformRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANUFACTURER: 'MANUFACTURER',
} as const;
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const WorkspaceRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
} as const;
export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

export type AnyRole = PlatformRole | WorkspaceRole;
