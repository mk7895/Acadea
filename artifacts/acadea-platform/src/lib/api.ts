export const API_BASE =
  (import.meta.env.VITE_PLATFORM_API_BASE?.trim() || "/api/platform").replace(/\/$/, "");

export type ApiError = {
  error?: string;
};

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
