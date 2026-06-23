"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useDevicesQuery(query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  const search = new URLSearchParams(
    Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {})
  ).toString();
  const path = search ? `/devices?${search}` : "/devices";

  return useQuery({
    queryKey: ["devices", query],
    queryFn: () => request<Array<Record<string, unknown>>>(path),
    enabled: isSessionReady
  });
}

export function useDeviceInventoryQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", "inventory"],
    queryFn: () => request<Array<Record<string, unknown>>>("/devices/inventory"),
    enabled: isSessionReady
  });
}

export function useDeviceDetailQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", deviceId],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceConfigQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", deviceId, "config"],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/config`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceDeploymentsQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", deviceId, "deployments"],
    queryFn: () => request<Array<Record<string, unknown>>>(`/devices/${deviceId}/config/deployments`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceDeploymentDetailQuery(deviceId: string, deploymentId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", deviceId, "deployments", deploymentId],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/config/deployments/${deploymentId}`),
    enabled: isSessionReady && Boolean(deviceId) && Boolean(deploymentId)
  });
}

export function useDeviceCredentialsQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", deviceId, "credentials"],
    queryFn: () => request<Array<Record<string, unknown>>>(`/devices/${deviceId}/credentials`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceLifecycleEventsQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["devices", deviceId, "lifecycle-events"],
    queryFn: () => request<Array<Record<string, unknown>>>(`/devices/${deviceId}/lifecycle-events`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useManufactureDeviceMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/devices/manufacture", "POST", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", "inventory"] });
    }
  });
}

export function useClaimDeviceMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/devices/claim", "POST", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", "inventory"] });
    }
  });
}

export function useUpdateDeviceMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, payload }: { deviceId: string; payload: Record<string, unknown> }) =>
      request<Record<string, unknown>>(`/devices/${deviceId}`, "PATCH", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", variables.deviceId] });
    }
  });
}

export function useDeleteDeviceMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => request<Record<string, unknown>>(`/devices/${deviceId}`, "DELETE"),
    onSuccess: (_, deviceId) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", deviceId] });
    }
  });
}

export function useTransferDeviceMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, payload }: { deviceId: string; payload: Record<string, unknown> }) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/transfer`, "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] })
  });
}

export function useDeployDeviceConfigMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => request<Record<string, unknown>>(`/devices/${deviceId}/config/deploy`, "POST", {}),
    onSuccess: (_, deviceId) => {
      queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "deployments"] });
      queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "config"] });
    }
  });
}

export function useUpdateDeploymentStatusMutation(deviceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/config/deployments/current/status`, "PUT", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "deployments"] })
  });
}

export function useCreateDeviceCredentialMutation(deviceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/credentials`, "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "credentials"] })
  });
}

export function useRevokeDeviceCredentialMutation(deviceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/credentials/${credentialId}/revoke`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices", deviceId, "credentials"] })
  });
}
