"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useApiClient } from "./client";

function toSearch(query: Record<string, string | number | boolean> = {}) {
  const search = new URLSearchParams(
    Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {})
  ).toString();
  return search ? `?${search}` : "";
}

export function useDeviceValuesQuery(deviceId: string, query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "values", query],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values${toSearch(query)}`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceValuesLatestQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "latest"],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/latest`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceValuesSnapshotQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "snapshot"],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/snapshot`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceValuesTableQuery(deviceId: string, query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "table", query],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/table${toSearch(query)}`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceValuesTimeseriesQuery(deviceId: string, portKey: string, query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "timeseries", portKey, query],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/timeseries/${portKey}${toSearch(query)}`),
    enabled: isSessionReady && Boolean(deviceId) && Boolean(portKey)
  });
}

export function useDeviceValuesModbusTimeseriesQuery(deviceId: string, readId: string, query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "timeseries", "modbus", readId, query],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/timeseries/modbus/${readId}${toSearch(query)}`),
    enabled: isSessionReady && Boolean(deviceId) && Boolean(readId)
  });
}

export function useDeviceValuesStatsQuery(deviceId: string, portKey: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "stats", portKey],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/stats/${portKey}`),
    enabled: isSessionReady && Boolean(deviceId) && Boolean(portKey)
  });
}

export function useDeviceValuesStatusQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "status"],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/status`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceValuesExportQuery(deviceId: string, query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["telemetry", deviceId, "export", query],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/values/export${toSearch(query)}`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useTelemetryIngestMutation(deviceId: string) {
  const { request } = useApiClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/telemetry/devices/${deviceId}/values`, "POST", payload)
  });
}
