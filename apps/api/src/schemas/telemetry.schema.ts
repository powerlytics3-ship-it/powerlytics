import { z } from "zod";

export const telemetryValueRecordSchema = z.object({
  id: z.string(),
  ts: z.string().datetime(),
  ingestTs: z.string().datetime(),
  workspaceId: z.string(),
  deviceId: z.string(),
  portKey: z.string(),
  portType: z.enum(["DIGITAL", "ANALOG", "MODBUS"]),
  readId: z.string().optional(),
  slaveId: z.string().optional(),
  rawValue: z.unknown(),
  calibratedValue: z.unknown().optional(),
  unit: z.string().optional(),
  quality: z.enum(["good", "bad", "uncertain"]),
  rawPayload: z.record(z.unknown()).optional(),
  parsedValue: z.number().optional(),
  rawRegisters: z.array(z.string()).optional(),
  bitsToRead: z.number().int().optional(),
  endianness: z.string().optional()
});

export const telemetrySnapshotSchema = z.object({
  deviceId: z.string(),
  values: z.array(telemetryValueRecordSchema)
});

export type TelemetryValueRecord = z.infer<typeof telemetryValueRecordSchema>;
export type TelemetrySnapshot = z.infer<typeof telemetrySnapshotSchema>;
