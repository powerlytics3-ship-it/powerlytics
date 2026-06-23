import { getServerSession } from "next-auth";
import { authOptions } from "../auth.config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = session?.user?.apiToken ?? process.env.POWERLYTIC_WEB_DEV_TOKEN;
    const workspaceId = session?.user?.workspaceId ?? process.env.POWERLYTIC_WEB_WORKSPACE_ID;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers: {
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...(workspaceId ? { "x-workspace-id": workspaceId } : {})
      }
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const session = await getServerSession(authOptions);
  const accessToken = session?.user?.apiToken ?? process.env.POWERLYTIC_WEB_DEV_TOKEN;
  const workspaceId = session?.user?.workspaceId ?? process.env.POWERLYTIC_WEB_WORKSPACE_ID;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(", ");
      } else if (typeof errorBody.message === "string") {
        message = errorBody.message;
      }
    } catch {
      // Keep status fallback message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}

export { API_BASE_URL };
