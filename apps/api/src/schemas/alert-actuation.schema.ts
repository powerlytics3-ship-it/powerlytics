import { z } from "zod";
import { ActuationStatus, AlertIncidentStatus, AlertSeverity } from "@powerlytic/types";

export const alertRuleRecordSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  deviceId: z.string().optional(),
  portKey: z.string().optional(),
  readId: z.string().optional(),
  comparator: z.enum(["GT", "GTE", "LT", "LTE", "EQ", "NEQ"]),
  threshold: z.number(),
  durationSeconds: z.number().int(),
  severity: z.nativeEnum(AlertSeverity),
  message: z.string(),
  active: z.boolean(),
  createdAt: z.string().datetime()
});

export const alertIncidentRecordSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  deviceId: z.string().optional(),
  alertRuleId: z.string().optional(),
  triggeredAt: z.string().datetime(),
  value: z.unknown().optional(),
  message: z.string(),
  severity: z.nativeEnum(AlertSeverity),
  status: z.nativeEnum(AlertIncidentStatus),
  acknowledgedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  sentTo: z.record(z.unknown()).optional()
});

export const actuationCommandRecordSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  deviceId: z.string(),
  requestedById: z.string(),
  portKey: z.string(),
  command: z.enum(["SET_ON", "SET_OFF", "PULSE"]),
  requestedValue: z.unknown(),
  reason: z.string(),
  status: z.nativeEnum(ActuationStatus),
  idempotencyKey: z.string(),
  sentAt: z.string().datetime().optional(),
  acknowledgedAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  failureMessage: z.string().optional(),
  createdAt: z.string().datetime()
});

export type AlertRuleRecord = z.infer<typeof alertRuleRecordSchema>;
export type AlertIncidentRecord = z.infer<typeof alertIncidentRecordSchema>;
export type ActuationCommandRecord = z.infer<typeof actuationCommandRecordSchema>;
