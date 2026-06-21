const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers: {
        // TODO: add Authorization: Bearer <OIDC access token> from the web auth session.
        ...(process.env.POWERLYTIC_WEB_DEV_TOKEN ? { authorization: `Bearer ${process.env.POWERLYTIC_WEB_DEV_TOKEN}` } : {}),
        // TODO: set selected workspace ID from the user's active organization switcher.
        ...(process.env.POWERLYTIC_WEB_WORKSPACE_ID ? { "x-workspace-id": process.env.POWERLYTIC_WEB_WORKSPACE_ID } : {})
      }
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export { API_BASE_URL };
