import type { Session } from "next-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function sessionHeaders(session: Session | null) {
  const accessToken = session?.user?.apiToken;
  const workspaceId = session?.user?.workspaceId;

  return {
    ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    ...(workspaceId ? { "x-workspace-id": workspaceId } : {})
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
  } catch {
    // Ignore JSON parse errors and fallback to status text.
  }
  return `Request failed with status ${response.status}`;
}

export async function clientApiRequest<T>(
  path: string,
  session: Session | null,
  method: ApiMethod = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(method !== "GET" ? { "content-type": "application/json" } : {}),
      ...sessionHeaders(session)
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
