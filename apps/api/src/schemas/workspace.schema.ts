import { z } from "zod";
import { Role, WorkspaceKind, WorkspaceStatus } from "@powerlytic/types";

export const workspaceRecordSchema = z.object({
  id: z.string(),
  kind: z.nativeEnum(WorkspaceKind),
  slug: z.string(),
  displayName: z.string(),
  legalName: z.string().optional(),
  industry: z.string().optional(),
  status: z.nativeEnum(WorkspaceStatus),
  timezone: z.string(),
  address: z.string().optional(),
  supportEmail: z.string().email().optional(),
  billingEmail: z.string().email().optional(),
  taxId: z.string().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const membershipRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  role: z.nativeEnum(Role),
  status: z.enum(["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"]),
  createdAt: z.string().datetime().optional()
});

export const invitationRecordSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  tokenHash: z.string(),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional()
});

export type WorkspaceRecord = z.infer<typeof workspaceRecordSchema>;
export type MembershipRecord = z.infer<typeof membershipRecordSchema>;
export type InvitationRecord = z.infer<typeof invitationRecordSchema>;
