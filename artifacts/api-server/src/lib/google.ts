import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type GoogleConfigOverride = Partial<{
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleGmailClientId: string;
  googleGmailClientSecret: string;
  googleGmailRefreshToken: string;
}>;

const runtimeConfig: GoogleConfigOverride = {};

const ENV_FILE_PATH = path.resolve(process.cwd(), ".env.local");

function readConfig() {
  const googleClientId =
    runtimeConfig.googleClientId ?? process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret =
    runtimeConfig.googleClientSecret ?? process.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken =
    runtimeConfig.googleRefreshToken ?? process.env.GOOGLE_REFRESH_TOKEN;
  const googleGmailClientId =
    runtimeConfig.googleGmailClientId ??
    process.env.GOOGLE_GMAIL_CLIENT_ID ??
    googleClientId;
  const googleGmailClientSecret =
    runtimeConfig.googleGmailClientSecret ??
    process.env.GOOGLE_GMAIL_CLIENT_SECRET ??
    googleClientSecret;
  const googleGmailRefreshToken =
    runtimeConfig.googleGmailRefreshToken ??
    process.env.GOOGLE_GMAIL_REFRESH_TOKEN ??
    googleRefreshToken;

  return {
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    googleGmailClientId,
    googleGmailClientSecret,
    googleGmailRefreshToken,
  };
}

function getTokenErrorMessage(
  data: { error?: string; error_description?: string },
  fallback: string,
) {
  return data.error_description ?? data.error ?? fallback;
}

export function getGoogleCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID ?? "primary";
}

export function getGoogleGmailSendAs() {
  return process.env.GOOGLE_GMAIL_SEND_AS;
}

let googleAccountEmailCache: string | null | undefined;

export function hasGoogleOAuthCredentials() {
  const { googleClientId, googleClientSecret, googleRefreshToken } =
    readConfig();
  return Boolean(googleClientId && googleClientSecret && googleRefreshToken);
}

export function hasGoogleGmailCredentials() {
  const {
    googleGmailClientId,
    googleGmailClientSecret,
    googleGmailRefreshToken,
  } = readConfig();
  return Boolean(
    googleGmailClientId &&
      googleGmailClientSecret &&
      googleGmailRefreshToken,
  );
}

export function getGoogleOAuthClientCredentials() {
  const { googleClientId, googleClientSecret } = readConfig();

  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth client credentials are incomplete");
  }

  return {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  };
}

export async function getGoogleAccessToken() {
  const { googleClientId, googleClientSecret, googleRefreshToken } =
    readConfig();

  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    throw new Error("Google OAuth credentials are incomplete");
  }

  const body = new URLSearchParams({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: googleRefreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      getTokenErrorMessage(
        data,
        `OAuth token refresh failed with status ${res.status}`,
      ),
    );
  }

  return data.access_token;
}

export async function getGoogleGmailAccessToken() {
  const {
    googleGmailClientId,
    googleGmailClientSecret,
    googleGmailRefreshToken,
  } = readConfig();

  if (
    !googleGmailClientId ||
    !googleGmailClientSecret ||
    !googleGmailRefreshToken
  ) {
    throw new Error("Google Gmail OAuth credentials are incomplete");
  }

  const body = new URLSearchParams({
    client_id: googleGmailClientId,
    client_secret: googleGmailClientSecret,
    refresh_token: googleGmailRefreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      getTokenErrorMessage(
        data,
        `Gmail OAuth token refresh failed with status ${res.status}`,
      ),
    );
  }

  return data.access_token;
}

export async function googleApiRequest(
  pathName: string,
  init?: RequestInit,
  baseUrl = "https://www.googleapis.com",
) {
  const accessToken = await getGoogleAccessToken();

  return fetch(`${baseUrl}${pathName}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function getGoogleAccountEmail() {
  if (googleAccountEmailCache !== undefined) {
    return googleAccountEmailCache;
  }

  if (!hasGoogleOAuthCredentials()) {
    googleAccountEmailCache = null;
    return googleAccountEmailCache;
  }

  const res = await googleApiRequest(
    `/calendar/v3/calendars/${encodeURIComponent(getGoogleCalendarId())}`,
  );
  const data = (await res.json()) as { id?: string };

  googleAccountEmailCache =
    typeof data.id === "string" && data.id.includes("@") ? data.id : null;
  return googleAccountEmailCache;
}

export async function updateStoredGoogleTokens(input: {
  calendarRefreshToken: string;
  gmailRefreshToken: string;
}) {
  runtimeConfig.googleRefreshToken = input.calendarRefreshToken;
  runtimeConfig.googleGmailRefreshToken = input.gmailRefreshToken;
  process.env.GOOGLE_REFRESH_TOKEN = input.calendarRefreshToken;
  process.env.GOOGLE_GMAIL_REFRESH_TOKEN = input.gmailRefreshToken;
  googleAccountEmailCache = undefined;

  let envText = "";
  try {
    envText = await readFile(ENV_FILE_PATH, "utf8");
  } catch {
    envText = "";
  }

  const upsertEnvVar = (source: string, key: string, value: string) => {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(source)) {
      return source.replace(pattern, line);
    }
    return source.trimEnd() ? `${source.trimEnd()}\n${line}\n` : `${line}\n`;
  };

  let nextText = envText;
  nextText = upsertEnvVar(
    nextText,
    "GOOGLE_REFRESH_TOKEN",
    input.calendarRefreshToken,
  );
  nextText = upsertEnvVar(
    nextText,
    "GOOGLE_GMAIL_REFRESH_TOKEN",
    input.gmailRefreshToken,
  );

  await writeFile(ENV_FILE_PATH, nextText, "utf8");
}
