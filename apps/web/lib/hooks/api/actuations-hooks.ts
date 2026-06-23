"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useDeviceActuationsQuery(deviceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["actuations", deviceId],
    queryFn: () => request<Array<Record<string, unknown>>>(`/devices/${deviceId}/actuations`),
    enabled: isSessionReady && Boolean(deviceId)
  });
}

export function useDeviceActuationDetailQuery(deviceId: string, actuationId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["actuations", deviceId, actuationId],
    queryFn: () => request<Record<string, unknown>>(`/devices/${deviceId}/actuations/${actuationId}`),
    enabled: isSessionReady && Boolean(deviceId) && Boolean(actuationId)
  });
}

export function useCreateActuationMutation(deviceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/actuations`, "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["actuations", deviceId] })
  });
}

export function useCancelActuationMutation(deviceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actuationId: string) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/actuations/${actuationId}/cancel`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["actuations", deviceId] })
  });
}

export function useRetryActuationMutation(deviceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actuationId: string) =>
      request<Record<string, unknown>>(`/devices/${deviceId}/actuations/${actuationId}/retry`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["actuations", deviceId] })
  });
}
