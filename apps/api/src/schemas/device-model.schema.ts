import { z } from "zod";
import { PortCategory, PortValueFormat } from "@powerlytic/types";

export const portTypeRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  codeName: z.string(),
  category: z.nativeEnum(PortCategory),
  valueFormat: z.nativeEnum(PortValueFormat),
  description: z.string().optional(),
  active: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const deviceModelPortRecordSchema = z.object({
  id: z.string(),
  deviceModelVersionId: z.string(),
  portTypeId: z.string(),
  portKey: z.string(),
  microControllerPin: z.string().optional(),
  description: z.string().optional()
});

export const deviceModelVersionRecordSchema = z.object({
  id: z.string(),
  deviceModelId: z.string(),
  version: z.number().int(),
  status: z.enum(["DRAFT", "PUBLISHED", "DEPRECATED"]),
  microControllerType: z.string(),
  hardwareRevision: z.string().optional(),
  firmwareFamily: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  deprecatedAt: z.string().datetime().optional(),
  ports: z.array(deviceModelPortRecordSchema)
});

export const deviceModelRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  description: z.string().optional(),
  versions: z.array(deviceModelVersionRecordSchema)
});

export type PortTypeRecord = z.infer<typeof portTypeRecordSchema>;
export type DeviceModelRecord = z.infer<typeof deviceModelRecordSchema>;
export type DeviceModelVersionRecord = z.infer<typeof deviceModelVersionRecordSchema>;
