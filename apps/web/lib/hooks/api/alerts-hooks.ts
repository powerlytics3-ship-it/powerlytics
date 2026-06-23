"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useAlertRulesQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["alert-rules"],
    queryFn: () => request<Array<Record<string, unknown>>>("/alert-rules"),
    enabled: isSessionReady
  });
}

export function useAlertRuleDetailQuery(id: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["alert-rules", id],
    queryFn: () => request<Record<string, unknown>>(`/alert-rules/${id}`),
    enabled: isSessionReady && Boolean(id)
  });
}

export function useAlertIncidentsQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["alert-incidents"],
    queryFn: () => request<Array<Record<string, unknown>>>("/alert-incidents"),
    enabled: isSessionReady
  });
}

export function useAlertIncidentDetailQuery(id: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["alert-incidents", id],
    queryFn: () => request<Record<string, unknown>>(`/alert-incidents/${id}`),
    enabled: isSessionReady && Boolean(id)
  });
}

export function useCreateAlertRuleMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/alert-rules", "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
  });
}

export function useUpdateAlertRuleMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      request<Record<string, unknown>>(`/alert-rules/${id}`, "PUT", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
      queryClient.invalidateQueries({ queryKey: ["alert-rules", variables.id] });
    }
  });
}

export function useDeactivateAlertRuleMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Record<string, unknown>>(`/alert-rules/${id}/deactivate`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
  });
}

export function useAckAlertIncidentMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Record<string, unknown>>(`/alert-incidents/${id}/ack`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-incidents"] })
  });
}

export function useResolveAlertIncidentMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Record<string, unknown>>(`/alert-incidents/${id}/resolve`, "POST", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-incidents"] })
  });
}
