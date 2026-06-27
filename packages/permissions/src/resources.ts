export const Resource = {
  WORKSPACE: 'workspace',
  MEMBERS: 'members',
  DEVICES: 'devices',
  DEVICE_MODELS: 'device_models',
  PORT_TYPES: 'port_types',
  CONFIG_DEPLOYMENT: 'config_deployment',
  TELEMETRY: 'telemetry',
  ACTUATION: 'actuation',
  ALERT_RULES: 'alert_rules',
  ALERT_EVENTS: 'alert_events',
  AUDIT_LOG: 'audit_log',
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];

export const Action = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  INVITE: 'invite',
  EDIT_ROLE: 'edit-role',
  REMOVE: 'remove',
  CLAIM: 'claim',
  EDIT_CONFIG: 'edit-config',
  TRANSFER_OUT: 'transfer-out',
  MANUFACTURE: 'manufacture',
  PUBLISH: 'publish',
  DEPLOY: 'deploy',
  VIEW_HISTORY: 'view-history',
  INGEST: 'ingest',
  SEND_COMMAND: 'send-command',
  ACKNOWLEDGE: 'acknowledge',
  RESOLVE: 'resolve',
} as const;
export type Action = (typeof Action)[keyof typeof Action];
