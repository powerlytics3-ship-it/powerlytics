"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useDeviceModelsQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["device-models"],
    queryFn: () => request<Array<Record<string, unknown>>>("/device-models"),
    enabled: isSessionReady
  });
}

export function useDeviceModelDetailQuery(modelId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["device-models", modelId],
    queryFn: () => request<Record<string, unknown>>(`/device-models/${modelId}`),
    enabled: isSessionReady && Boolean(modelId)
  });
}

export function useCreateDeviceModelMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/device-models", "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["device-models"] })
  });
}

export function usePublishDeviceModelMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => request<Record<string, unknown>>(`/device-models/${modelId}/publish`, "POST", {}),
    onSuccess: (_, modelId) => {
      queryClient.invalidateQueries({ queryKey: ["device-models"] });
      queryClient.invalidateQueries({ queryKey: ["device-models", modelId] });
    }
  });
}

export function useNewDeviceModelVersionMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => request<Record<string, unknown>>(`/device-models/${modelId}/new-version`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["device-models"] })
  });
}

export function useDeprecateDeviceModelMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => request<Record<string, unknown>>(`/device-models/${modelId}/deprecate`, "POST", {}),
    onSuccess: (_, modelId) => {
      queryClient.invalidateQueries({ queryKey: ["device-models"] });
      queryClient.invalidateQueries({ queryKey: ["device-models", modelId] });
    }
  });
}

export function useDeleteDeviceModelMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => request<Record<string, unknown>>(`/device-models/${modelId}`, "DELETE"),
    onSuccess: (_, modelId) => {
      queryClient.invalidateQueries({ queryKey: ["device-models"] });
      queryClient.invalidateQueries({ queryKey: ["device-models", modelId] });
    }
  });
}
