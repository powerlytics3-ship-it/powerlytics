import { z } from "zod";
import {
  AlertSeverity,
  DeviceLifecycleStatus,
  PortCategory,
  PortValueFormat,
  Role,
  WorkspaceKind
} from "@powerlytic/types";

const enumValues = <T extends Record<string, string>>(value: T) =>
  Object.values(value) as [T[keyof T], ...Array<T[keyof T]>];

export const workspaceSchema = z.object({
  displayName: z.string().min(2),
  legalName: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  kind: z.enum(enumValues(WorkspaceKind)).default(WorkspaceKind.ORGANIZATION),
  industry: z.string().optional(),
  timezone: z.string().default("UTC"),
  address: z.string().optional(),
  supportEmail: z.string().email().optional(),
  billingEmail: z.string().email().optional(),
  taxId: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

export const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(enumValues(Role)),
  expiresInDays: z.number().int().min(1).max(30).default(7)
});

export const portTypeSchema = z.object({
  name: z.string().min(2),
  codeName: z.string().min(1).max(12).regex(/^[A-Z][A-Z0-9_]*$/),
  category: z.enum(enumValues(PortCategory)),
  valueFormat: z.enum(enumValues(PortValueFormat)),
  description: z.string().optional()
});

export const deviceModelPortSchema = z.object({
  portTypeId: z.string().min(1),
  microControllerPin: z.string().optional(),
  description: z.string().optional()
});

export const createDeviceModelSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  microControllerType: z.string().min(2),
  hardwareRevision: z.string().optional(),
  firmwareFamily: z.string().optional(),
  ports: z.array(deviceModelPortSchema).min(1)
});

export const manufactureDeviceSchema = z.object({
  imei: z.string().min(6),
  serialNumber: z.string().min(2).optional(),
  batchNumber: z.string().optional(),
  manufactureDate: z.string().datetime().optional(),
  deviceModelVersionId: z.string().min(1),
  hardwareRevision: z.string().optional(),
  firmwareVersion: z.string().optional(),
  name: z.string().min(2).optional(),
  metadata: z.record(z.unknown()).default({})
});

export const claimDeviceSchema = z.object({
  claimCode: z.string().min(8),
  workspaceId: z.string().min(1),
  name: z.string().min(2).optional(),
  installationSite: z.string().optional()
});

const serialSchema = z.object({
  baudRate: z.number().int().positive(),
  dataBits: z.number().int().min(5).max(8),
  stopBits: z.number().min(1).max(2),
  parity: z.enum(["none", "even", "odd"])
});

const pollingSchema = z.object({
  intervalMs: z.number().int().positive(),
  timeoutMs: z.number().int().positive(),
  retries: z.number().int().min(0).max(10)
});

export const modbusReadSchema = z.object({
  readId: z.string().optional(),
  slaveId: z.string().optional(),
  portKey: z.string().optional(),
  functionCode: z.enum(["fc_1", "fc_2", "fc_3", "fc_4"]),
  startAddress: z.number().int().min(0),
  bitsToRead: z.number().int().refine((value) => [8, 16, 32, 64].includes(value)),
  name: z.string().min(1),
  description: z.string().optional(),
  scaling: z.number().default(1),
  offset: z.number().default(0),
  unit: z.string().optional(),
  tag: z.string().optional(),
  dataType: z.string().optional(),
  endianness: z.enum(["ABCD", "CDAB", "BADC", "DCBA", "NONE"]).default("NONE")
});

export const modbusSlaveSchema = z.object({
  slaveId: z.string().min(1),
  name: z.string().min(1),
  serial: serialSchema,
  polling: pollingSchema,
  reads: z.array(modbusReadSchema).default([])
});

export const updateDeviceSchema = z.object({
  name: z.string().min(2).optional(),
  lifecycleStatus: z.enum(enumValues(DeviceLifecycleStatus)).optional(),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional()
  }).optional(),
  pointOfContact: z.string().optional(),
  alertEmails: z.array(z.string().email()).optional(),
  alertPhones: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  ports: z.array(z.object({
    portKey: z.string().min(1),
    unit: z.string().optional(),
    calibrationValue: z.object({
      scaling: z.number(),
      offset: z.number()
    }).optional(),
    thresholds: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      message: z.string().optional()
    }).optional(),
    modbusSlaves: z.array(modbusSlaveSchema).optional()
  })).optional()
});

export const telemetryIngestSchema = z.object({
  deviceId: z.string().optional(),
  ts: z.union([z.string().datetime(), z.date()]).optional(),
  values: z.record(z.unknown())
});

export const deploymentStatusCallbackSchema = z.object({
  status: z.enum(["applied", "error", "APPLIED", "ERROR"]),
  message: z.string().optional(),
  configId: z.string().optional(),
  hash: z.string().optional()
});

export const createAlertRuleSchema = z.object({
  workspaceId: z.string().min(1),
  deviceId: z.string().min(1).optional(),
  portKey: z.string().min(1).optional(),
  readId: z.string().optional(),
  comparator: z.enum(["GT", "GTE", "LT", "LTE", "EQ", "NEQ"]),
  threshold: z.number(),
  durationSeconds: z.number().int().min(0).default(0),
  severity: z.enum(enumValues(AlertSeverity)),
  message: z.string().min(1)
});

export const createActuationSchema = z.object({
  portKey: z.string().min(1),
  command: z.enum(["SET_ON", "SET_OFF", "PULSE"]),
  requestedValue: z.union([z.boolean(), z.number(), z.string()]),
  reason: z.string().min(3),
  idempotencyKey: z.string().min(8)
});

export type TelemetryIngestInput = z.infer<typeof telemetryIngestSchema>;
