export const COOKIE_CONSENT_COOKIE_NAME = "acadea_cookie_consent_v1";
export const PLATFORM_COOKIE_CONSENT_COOKIE_NAME = "acadea_platform_cookie_consent_v1";
export const TIMEZONE_COOKIE_NAME = "acadea_timezone";
export const ARTICLE_PREFETCH_SESSION_COOKIE_NAME = "acadea_article_prefetch_session_v1";
const COOKIE_MAX_AGE_180_DAYS = 60 * 60 * 24 * 180;
const COOKIE_MAX_AGE_365_DAYS = 60 * 60 * 24 * 365;

function getSharedCookieDomain() {
  if (typeof window === "undefined") {
    return null;
  }

  const { hostname } = window.location;
  return hostname === "acadea.org" || hostname.endsWith(".acadea.org") ? "acadea.org" : null;
}

export function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(encodedName));
  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(encodedName.length));
}

export function setCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_180_DAYS) {
  if (typeof document === "undefined") {
    return;
  }

  const domain = getSharedCookieDomain();
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
    "SameSite=Lax",
    domain ? `Domain=${domain}` : null,
  ].filter(Boolean).join("; ");
}

export function setSessionCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  const domain = getSharedCookieDomain();
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    "SameSite=Lax",
    domain ? `Domain=${domain}` : null,
  ].filter(Boolean).join("; ");
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  const domain = getSharedCookieDomain();
  document.cookie = [
    `${encodeURIComponent(name)}=`,
    "path=/",
    "max-age=0",
    "SameSite=Lax",
    domain ? `Domain=${domain}` : null,
  ].filter(Boolean).join("; ");
}

export function setLongLivedCookie(name: string, value: string) {
  setCookie(name, value, COOKIE_MAX_AGE_365_DAYS);
}
