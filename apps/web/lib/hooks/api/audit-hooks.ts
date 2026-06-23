"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useAuditLogsQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => request<Array<Record<string, unknown>>>("/audit-logs"),
    enabled: isSessionReady
  });
}

export function useOrganizationAuditLogsQuery(orgId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["audit-logs", "organization", orgId],
    queryFn: () => request<Array<Record<string, unknown>>>(`/organizations/${orgId}/audit-logs`),
    enabled: isSessionReady && Boolean(orgId)
  });
}

export function useDeviceAuditLogsQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["audit-logs", "device", deviceId],
    queryFn: () => request<Array<Record<string, unknown>>>(`/devices/${deviceId}/audit-logs`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}
