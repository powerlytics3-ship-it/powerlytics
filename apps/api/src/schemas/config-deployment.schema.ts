import { z } from "zod";
import { DeploymentStatus } from "@powerlytic/types";

export const deviceConfigRegisterSchema = z.object({
  readId: z.string(),
  func: z.enum(["fc_1", "fc_2", "fc_3", "fc_4"]),
  start: z.number().int(),
  bits: z.number().int()
});

export const hardwareConfigPayloadSchema = z.object({
  device_id: z.string(),
  configId: z.string(),
  imei: z.string(),
  modbusSlaves: z.array(z.object({
    unique_slave_id: z.string(),
    slave_id: z.number(),
    serial: z.object({
      baudRate: z.number(),
      dataBits: z.number(),
      stopBits: z.number(),
      parity: z.enum(["none", "even", "odd"])
    }),
    polling: z.object({
      intervalMs: z.number(),
      timeoutMs: z.number(),
      retries: z.number()
    }),
    registers: z.array(deviceConfigRegisterSchema)
  }))
});

export const configDeploymentRecordSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  configId: z.string(),
  configHash: z.string(),
  payload: z.object({
    message: z.literal("config"),
    hash: z.string(),
    configId: z.string(),
    config: hardwareConfigPayloadSchema
  }),
  status: z.nativeEnum(DeploymentStatus),
  message: z.string().optional(),
  sentAt: z.string().datetime().optional(),
  appliedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional()
});

export type HardwareConfigPayload = z.infer<typeof hardwareConfigPayloadSchema>;
export type ConfigDeploymentRecord = z.infer<typeof configDeploymentRecordSchema>;
