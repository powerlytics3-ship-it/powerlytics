import { z } from "zod";
import { DeviceHealthStatus, DeviceLifecycleStatus } from "@powerlytic/types";

export const calibrationSchema = z.object({
  scaling: z.number(),
  offset: z.number()
});

export const thresholdSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  message: z.string().optional()
});

export const serialSchema = z.object({
  baudRate: z.number().int(),
  dataBits: z.number().int(),
  stopBits: z.number(),
  parity: z.enum(["none", "even", "odd"])
});

export const pollingSchema = z.object({
  intervalMs: z.number().int(),
  timeoutMs: z.number().int(),
  retries: z.number().int()
});

export const modbusReadRecordSchema = z.object({
  id: z.string().optional(),
  readId: z.string(),
  slaveId: z.string(),
  portKey: z.string(),
  registerType: z.enum(["holding", "input", "coil", "discrete"]).optional(),
  functionCode: z.enum(["fc_1", "fc_2", "fc_3", "fc_4"]),
  startAddress: z.number().int(),
  bitsToRead: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  scaling: z.number(),
  offset: z.number(),
  unit: z.string().optional(),
  tag: z.string().optional(),
  dataType: z.string().optional(),
  endianness: z.enum(["ABCD", "CDAB", "BADC", "DCBA", "NONE"])
});

export const modbusSlaveRecordSchema = z.object({
  id: z.string().optional(),
  slaveId: z.string(),
  portKey: z.string(),
  name: z.string(),
  serial: serialSchema,
  polling: pollingSchema,
  reads: z.array(modbusReadRecordSchema)
});

export const devicePortRecordSchema = z.object({
  id: z.string().optional(),
  portKey: z.string(),
  name: z.string(),
  portTypeId: z.string(),
  unit: z.string().optional(),
  calibrationValue: calibrationSchema,
  status: z.enum(["ACTIVE", "INACTIVE", "FAULT"]),
  thresholds: thresholdSchema.optional(),
  modbusSlaves: z.array(modbusSlaveRecordSchema).optional()
});

export const deviceRecordSchema = z.object({
  id: z.string(),
  configId: z.string(),
  imei: z.string(),
  serialNumber: z.string().optional(),
  batchNumber: z.string().optional(),
  name: z.string(),
  deviceModelId: z.string(),
  workspaceId: z.string().optional(),
  lifecycleStatus: z.nativeEnum(DeviceLifecycleStatus),
  healthStatus: z.nativeEnum(DeviceHealthStatus),
  firmwareVersion: z.string().optional(),
  hardwareRevision: z.string().optional(),
  lastSeenAt: z.string().datetime().optional(),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional()
  }).optional(),
  pointOfContact: z.string().optional(),
  alertEmails: z.array(z.string().email()).optional(),
  alertPhones: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  ports: z.array(devicePortRecordSchema)
});

export type DeviceRecord = z.infer<typeof deviceRecordSchema>;
export type DevicePortRecord = z.infer<typeof devicePortRecordSchema>;
export type ModbusSlaveRecord = z.infer<typeof modbusSlaveRecordSchema>;
export type ModbusReadRecord = z.infer<typeof modbusReadRecordSchema>;
