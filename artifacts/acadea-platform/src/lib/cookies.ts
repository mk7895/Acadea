export const PLATFORM_COOKIE_CONSENT_COOKIE_NAME = "acadea_platform_cookie_consent_v1";

const COOKIE_MAX_AGE_365_DAYS = 60 * 60 * 24 * 365;

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

export function setLongLivedCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${COOKIE_MAX_AGE_365_DAYS}`,
    "SameSite=Lax",
  ].join("; ");
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${encodeURIComponent(name)}=`,
    "path=/",
    "max-age=0",
    "SameSite=Lax",
  ].join("; ");
}
