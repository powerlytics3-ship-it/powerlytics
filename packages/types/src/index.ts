export const WorkspaceKind = {
  ORGANIZATION: "ORGANIZATION",
  PERSONAL: "PERSONAL"
} as const;

export type WorkspaceKind = (typeof WorkspaceKind)[keyof typeof WorkspaceKind];

export const WorkspaceStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DEACTIVATED: "DEACTIVATED"
} as const;

export type WorkspaceStatus = (typeof WorkspaceStatus)[keyof typeof WorkspaceStatus];

export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ENGINEERING_ADMIN: "ENGINEERING_ADMIN",
  MANUFACTURER: "MANUFACTURER",
  WORKSPACE_ADMIN: "WORKSPACE_ADMIN",
  OPERATOR: "OPERATOR",
  VIEWER: "VIEWER"
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const LegacyRole = {
  CompanyAdmin: "CompanyAdmin",
  OrgAdmin: "OrgAdmin",
  OrgUser: "OrgUser"
} as const;

export type LegacyRole = (typeof LegacyRole)[keyof typeof LegacyRole];

export const DeviceLifecycleStatus = {
  MANUFACTURED: "MANUFACTURED",
  IN_INVENTORY: "IN_INVENTORY",
  ASSIGNED_TO_WORKSPACE: "ASSIGNED_TO_WORKSPACE",
  INSTALLED: "INSTALLED",
  COMMISSIONING: "COMMISSIONING",
  ACTIVE: "ACTIVE",
  MAINTENANCE: "MAINTENANCE",
  SUSPENDED: "SUSPENDED",
  RETIRED: "RETIRED"
} as const;

export type DeviceLifecycleStatus =
  (typeof DeviceLifecycleStatus)[keyof typeof DeviceLifecycleStatus];

export const DeviceHealthStatus = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  MAINTENANCE: "MAINTENANCE",
  DEGRADED: "DEGRADED"
} as const;

export type DeviceHealthStatus = (typeof DeviceHealthStatus)[keyof typeof DeviceHealthStatus];

export const PortCategory = {
  INPUT: "INPUT",
  OUTPUT: "OUTPUT"
} as const;

export type PortCategory = (typeof PortCategory)[keyof typeof PortCategory];

export const PortValueFormat = {
  ANALOG: "ANALOG",
  DIGITAL: "DIGITAL",
  MODBUS: "MODBUS",
  AC_INPUT: "AC_INPUT"
} as const;

export type PortValueFormat = (typeof PortValueFormat)[keyof typeof PortValueFormat];

export const DeploymentStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  APPLIED: "APPLIED",
  ERROR: "ERROR",
  SUPERSEDED: "SUPERSEDED"
} as const;

export type DeploymentStatus = (typeof DeploymentStatus)[keyof typeof DeploymentStatus];

export const ActuationStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  PENDING: "PENDING",
  SENT: "SENT",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED"
} as const;

export type ActuationStatus = (typeof ActuationStatus)[keyof typeof ActuationStatus];

export const AlertSeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;

export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const AlertIncidentStatus = {
  NEW: "NEW",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED"
} as const;

export type AlertIncidentStatus =
  (typeof AlertIncidentStatus)[keyof typeof AlertIncidentStatus];

export type Endianness = "ABCD" | "CDAB" | "BADC" | "DCBA" | "NONE";
export type ModbusFunctionCode = "fc_1" | "fc_2" | "fc_3" | "fc_4";

export interface WorkspaceSummary {
  id: string;
  displayName: string;
  slug: string;
  kind: WorkspaceKind;
  status: WorkspaceStatus;
  timezone: string;
}

export interface MembershipSummary {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
}

export interface PortTypeDto {
  id: string;
  name: string;
  codeName: string;
  category: PortCategory;
  valueFormat: PortValueFormat;
  description?: string;
  active: boolean;
}

export interface DeviceModelPortDto {
  id?: string;
  portKey: string;
  portTypeId: string;
  microControllerPin?: string;
  description?: string;
}

export interface DeviceModelDto {
  id: string;
  name: string;
  version: number;
  sku: string;
  description?: string;
  microControllerType: string;
  publishedAt?: string;
  deprecatedAt?: string;
  ports: DeviceModelPortDto[];
}

export interface CalibrationDto {
  scaling: number;
  offset: number;
}

export interface ThresholdDto {
  min?: number;
  max?: number;
  message?: string;
}

export interface ModbusReadDto {
  readId: string;
  slaveId: string;
  portKey: string;
  registerType?: "holding" | "input" | "coil" | "discrete";
  functionCode: ModbusFunctionCode;
  startAddress: number;
  bitsToRead: number;
  name: string;
  description?: string;
  scaling: number;
  offset: number;
  unit?: string;
  tag?: string;
  dataType?: string;
  endianness: Endianness;
}

export interface ModbusSlaveDto {
  slaveId: string;
  portKey: string;
  name: string;
  serial: {
    baudRate: number;
    dataBits: number;
    stopBits: number;
    parity: "none" | "even" | "odd";
  };
  polling: {
    intervalMs: number;
    timeoutMs: number;
    retries: number;
  };
  reads: ModbusReadDto[];
}

export interface DevicePortDto {
  portKey: string;
  name: string;
  portTypeId: string;
  unit?: string;
  calibrationValue: CalibrationDto;
  status: "ACTIVE" | "INACTIVE" | "FAULT";
  thresholds?: ThresholdDto;
  modbusSlaves?: ModbusSlaveDto[];
}

export interface DeviceDto {
  id: string;
  configId: string;
  name: string;
  imei: string;
  serialNumber?: string;
  batchNumber?: string;
  deviceModelId: string;
  workspaceId?: string;
  lifecycleStatus: DeviceLifecycleStatus;
  healthStatus: DeviceHealthStatus;
  location?: { lat?: number; lng?: number; address?: string };
  ports: DevicePortDto[];
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
}

export interface LegacyTelemetryPayload {
  deviceId?: string;
  ts?: string | Date;
  values: Record<string, unknown>;
}

export interface DeviceConfigPayload {
  device_id: string;
  configId: string;
  imei: string;
  modbusSlaves: Array<{
    unique_slave_id: string;
    slave_id: number;
    serial: ModbusSlaveDto["serial"];
    polling: ModbusSlaveDto["polling"];
    registers: Array<{
      readId: string;
      func: ModbusFunctionCode;
      start: number;
      bits: number;
    }>;
  }>;
}
