import { WorkspaceRole, PlatformRole } from './roles';
import { Resource, Action } from './resources';

type RoleMatrix = Partial<Record<Resource, Action[]>>;

const OWNER: RoleMatrix = {
  [Resource.WORKSPACE]: [Action.VIEW, Action.EDIT, Action.DELETE],
  [Resource.MEMBERS]: [Action.VIEW, Action.INVITE, Action.EDIT_ROLE, Action.REMOVE],
  [Resource.DEVICES]: [Action.VIEW, Action.CLAIM, Action.EDIT_CONFIG, Action.TRANSFER_OUT],
  [Resource.DEVICE_MODELS]: [Action.VIEW],
  [Resource.PORT_TYPES]: [Action.VIEW],
  [Resource.CONFIG_DEPLOYMENT]: [Action.DEPLOY, Action.VIEW_HISTORY],
  [Resource.TELEMETRY]: [Action.VIEW],
  [Resource.ACTUATION]: [Action.SEND_COMMAND, Action.VIEW_HISTORY],
  [Resource.ALERT_RULES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
  [Resource.ALERT_EVENTS]: [Action.VIEW, Action.ACKNOWLEDGE, Action.RESOLVE],
  [Resource.AUDIT_LOG]: [Action.VIEW],
};

const ADMIN: RoleMatrix = {
  [Resource.WORKSPACE]: [Action.VIEW, Action.EDIT],
  [Resource.MEMBERS]: [Action.VIEW, Action.INVITE, Action.EDIT_ROLE, Action.REMOVE],
  [Resource.DEVICES]: [Action.VIEW, Action.CLAIM, Action.EDIT_CONFIG, Action.TRANSFER_OUT],
  [Resource.DEVICE_MODELS]: [Action.VIEW],
  [Resource.PORT_TYPES]: [Action.VIEW],
  [Resource.CONFIG_DEPLOYMENT]: [Action.DEPLOY, Action.VIEW_HISTORY],
  [Resource.TELEMETRY]: [Action.VIEW],
  [Resource.ACTUATION]: [Action.SEND_COMMAND, Action.VIEW_HISTORY],
  [Resource.ALERT_RULES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
  [Resource.ALERT_EVENTS]: [Action.VIEW, Action.ACKNOWLEDGE, Action.RESOLVE],
  [Resource.AUDIT_LOG]: [Action.VIEW],
};

const OPERATOR: RoleMatrix = {
  [Resource.WORKSPACE]: [Action.VIEW],
  [Resource.MEMBERS]: [Action.VIEW],
  [Resource.DEVICES]: [Action.VIEW, Action.EDIT_CONFIG],
  [Resource.DEVICE_MODELS]: [Action.VIEW],
  [Resource.PORT_TYPES]: [Action.VIEW],
  [Resource.CONFIG_DEPLOYMENT]: [Action.DEPLOY, Action.VIEW_HISTORY],
  [Resource.TELEMETRY]: [Action.VIEW],
  [Resource.ACTUATION]: [Action.SEND_COMMAND, Action.VIEW_HISTORY],
  [Resource.ALERT_RULES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
  [Resource.ALERT_EVENTS]: [Action.VIEW, Action.ACKNOWLEDGE, Action.RESOLVE],
  [Resource.AUDIT_LOG]: [],
};

const VIEWER: RoleMatrix = {
  [Resource.WORKSPACE]: [Action.VIEW],
  [Resource.MEMBERS]: [Action.VIEW],
  [Resource.DEVICES]: [Action.VIEW],
  [Resource.DEVICE_MODELS]: [Action.VIEW],
  [Resource.PORT_TYPES]: [Action.VIEW],
  [Resource.CONFIG_DEPLOYMENT]: [Action.VIEW_HISTORY],
  [Resource.TELEMETRY]: [Action.VIEW],
  [Resource.ACTUATION]: [Action.VIEW_HISTORY],
  [Resource.ALERT_RULES]: [Action.VIEW],
  [Resource.ALERT_EVENTS]: [Action.VIEW],
  [Resource.AUDIT_LOG]: [],
};

const SUPER_ADMIN: RoleMatrix = {
  [Resource.WORKSPACE]: [Action.VIEW, Action.EDIT, Action.DELETE],
  [Resource.MEMBERS]: [Action.VIEW, Action.INVITE, Action.EDIT_ROLE, Action.REMOVE],
  [Resource.DEVICES]: [Action.VIEW, Action.CLAIM, Action.EDIT_CONFIG, Action.TRANSFER_OUT, Action.MANUFACTURE],
  [Resource.DEVICE_MODELS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.PUBLISH],
  [Resource.PORT_TYPES]: [Action.VIEW, Action.CREATE, Action.EDIT],
  [Resource.CONFIG_DEPLOYMENT]: [Action.DEPLOY, Action.VIEW_HISTORY],
  [Resource.TELEMETRY]: [Action.VIEW],
  [Resource.ACTUATION]: [Action.SEND_COMMAND, Action.VIEW_HISTORY],
  [Resource.ALERT_RULES]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.DELETE],
  [Resource.ALERT_EVENTS]: [Action.VIEW, Action.ACKNOWLEDGE, Action.RESOLVE],
  [Resource.AUDIT_LOG]: [Action.VIEW],
};

const MANUFACTURER: RoleMatrix = {
  [Resource.DEVICES]: [Action.VIEW, Action.MANUFACTURE],
  [Resource.DEVICE_MODELS]: [Action.VIEW, Action.CREATE, Action.EDIT, Action.PUBLISH],
  [Resource.PORT_TYPES]: [Action.VIEW, Action.CREATE, Action.EDIT],
};

export const PERMISSION_MATRIX: Record<string, RoleMatrix> = {
  [WorkspaceRole.OWNER]: OWNER,
  [WorkspaceRole.ADMIN]: ADMIN,
  [WorkspaceRole.OPERATOR]: OPERATOR,
  [WorkspaceRole.VIEWER]: VIEWER,
  [PlatformRole.SUPER_ADMIN]: SUPER_ADMIN,
  [PlatformRole.MANUFACTURER]: MANUFACTURER,
};
