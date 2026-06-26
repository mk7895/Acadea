const localBase = import.meta.env.BASE_URL.replace(/\/$/, "");
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiOrigin() {
  if (!configuredApiBase) return localBase;

  const normalized = trimTrailingSlashes(configuredApiBase);
  return normalized.endsWith("/api")
    ? normalized.slice(0, -4)
    : normalized;
}

export function getApiBase() {
  const origin = getApiOrigin();
  return origin ? `${trimTrailingSlashes(origin)}/api` : "/api";
}

