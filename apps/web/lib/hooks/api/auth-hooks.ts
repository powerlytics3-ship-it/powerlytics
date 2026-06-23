"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useApiClient } from "./client";

export function useAuthMeQuery() {
  const { request, isSessionReady } = useApiClient();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => request<Record<string, unknown>>("/auth/me"),
    enabled: isSessionReady
  });
}

export function useAuthLoginMutation() {
  const { request } = useApiClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/auth/login", "POST", payload)
  });
}

export function useAuthRefreshMutation() {
  const { request } = useApiClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/auth/refresh", "POST", payload)
  });
}

export function useAuthRequestResetMutation() {
  const { request } = useApiClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/auth/request-reset", "POST", payload)
  });
}

export function useAuthResetPasswordMutation() {
  const { request } = useApiClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<Record<string, unknown>>("/auth/reset-password", "POST", payload)
  });
}

export function useAuthLogoutMutation() {
  const { request } = useApiClient();
  return useMutation({
    mutationFn: () => request<Record<string, unknown>>("/auth/logout", "POST", {})
  });
}
