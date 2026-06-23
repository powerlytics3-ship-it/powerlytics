"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useUsersQuery(query: Record<string, string | number | boolean> = {}) {
  const { request, isSessionReady } = useApiClient();
  const search = new URLSearchParams(
    Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {})
  ).toString();

  const path = search ? `/users?${search}` : "/users";

  return useQuery({
    queryKey: ["users", query],
    queryFn: () => request<Array<Record<string, unknown>>>(path),
    enabled: isSessionReady
  });
}

export function useOrganizationUsersQuery(orgId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["users", "organization", orgId],
    queryFn: () => request<Array<Record<string, unknown>>>(`/users/org/${orgId}`),
    enabled: isSessionReady && Boolean(orgId)
  });
}

export function useUserDetailQuery(id: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => request<Record<string, unknown>>(`/users/${id}`),
    enabled: isSessionReady && Boolean(id)
  });
}

export function useCreateUserMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/users", "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}

export function useUpdateUserMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      request<Record<string, unknown>>(`/users/${id}`, "PUT", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.id] });
    }
  });
}

export function useDeleteUserMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => request<Record<string, unknown>>(`/users/${id}`, "DELETE"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    }
  });
}

export function useRegisterCompanyAdminMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/users/register-company-admin", "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}

export function useRegisterOrganizationAndAdminMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/users/register-organization", "POST", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }
  });
}

export function useRegisterOrgUserMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/users/register-org-user", "POST", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
}
