"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function usePortTypesQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["port-types"],
    queryFn: () => request<Array<Record<string, unknown>>>("/port-types"),
    enabled: isSessionReady
  });
}

export function usePortTypeDetailQuery(id: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["port-types", id],
    queryFn: () => request<Record<string, unknown>>(`/port-types/${id}`),
    enabled: isSessionReady && Boolean(id)
  });
}

export function useCreatePortTypeMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/port-types", "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["port-types"] })
  });
}

export function useUpdatePortTypeMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      request<Record<string, unknown>>(`/port-types/${id}`, "PUT", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["port-types"] });
      queryClient.invalidateQueries({ queryKey: ["port-types", variables.id] });
    }
  });
}

export function useDeactivatePortTypeMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Record<string, unknown>>(`/port-types/${id}/deactivate`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["port-types"] })
  });
}

export function useDeletePortTypeMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Record<string, unknown>>(`/port-types/${id}`, "DELETE"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["port-types"] });
      queryClient.invalidateQueries({ queryKey: ["port-types", id] });
    }
  });
}
