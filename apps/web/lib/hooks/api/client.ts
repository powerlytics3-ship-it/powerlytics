"use client";

import { useSession } from "next-auth/react";
import { clientApiRequest } from "../../client-api";

export function useApiClient() {
  const { data: session, status } = useSession();
  const isSessionReady = status !== "loading";

  const request = async <T>(path: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET", body?: unknown): Promise<T> => {
    if (!isSessionReady) {
      throw new Error("Session is not ready. Please wait for authentication to complete.");
    }
    return clientApiRequest<T>(path, session, method, body);
  };

  return {
    request,
    isSessionReady
  };
}
