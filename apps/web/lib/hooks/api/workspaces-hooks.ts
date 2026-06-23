"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useWorkspacesQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => request<Array<Record<string, unknown>>>("/workspaces"),
    enabled: isSessionReady
  });
}

export function useWorkspaceDetailQuery(workspaceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["workspaces", workspaceId],
    queryFn: () => request<Record<string, unknown>>(`/workspaces/${workspaceId}`),
    enabled: isSessionReady && Boolean(workspaceId)
  });
}

export function useWorkspaceMembershipsQuery(workspaceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["workspaces", workspaceId, "memberships"],
    queryFn: () => request<Array<Record<string, unknown>>>(`/workspaces/${workspaceId}/memberships`),
    enabled: isSessionReady && Boolean(workspaceId)
  });
}

export function useWorkspaceInvitationsQuery(workspaceId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["workspaces", workspaceId, "invitations"],
    queryFn: () => request<Array<Record<string, unknown>>>(`/workspaces/${workspaceId}/invitations`),
    enabled: isSessionReady && Boolean(workspaceId)
  });
}

export function useOrganizationsQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => request<Array<Record<string, unknown>>>("/organizations"),
    enabled: isSessionReady
  });
}

export function useOrganizationDetailQuery(orgId: string) {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["organizations", orgId],
    queryFn: () => request<Record<string, unknown>>(`/organizations/${orgId}`),
    enabled: isSessionReady && Boolean(orgId)
  });
}

export function useCreateWorkspaceMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/workspaces", "POST", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }
  });
}

export function useCreateOrganizationMutation() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/organizations", "POST", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }
  });
}

export function useCreateWorkspaceInvitationMutation(workspaceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/workspaces/${workspaceId}/invitations`, "POST", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "invitations"] });
    }
  });
}

export function useRemoveWorkspaceMembershipMutation(workspaceId: string) {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) =>
      request<Record<string, unknown>>(`/workspaces/${workspaceId}/memberships/${membershipId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "memberships"] });
    }
  });
}
