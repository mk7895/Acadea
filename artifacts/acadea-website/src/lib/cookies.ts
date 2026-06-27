export const COOKIE_CONSENT_COOKIE_NAME = "acadea_cookie_consent_v1";
export const TIMEZONE_COOKIE_NAME = "acadea_timezone";
const COOKIE_MAX_AGE_180_DAYS = 60 * 60 * 24 * 180;
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

export function setCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_180_DAYS) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
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

export function setLongLivedCookie(name: string, value: string) {
  setCookie(name, value, COOKIE_MAX_AGE_365_DAYS);
}
