import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";

type GoogleConfigOverride = Partial<{
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleGmailClientId: string;
  googleGmailClientSecret: string;
  googleGmailRefreshToken: string;
}>;

type GoogleTokenRecord = {
  calendarRefreshToken: string;
  gmailRefreshToken: string;
};

const runtimeConfig: GoogleConfigOverride = {};

const ENV_FILE_PATH = path.resolve(process.cwd(), ".env.local");
const GOOGLE_TOKEN_ROW_ID = 1;

let googleAccountEmailCache: string | null | undefined;
let databaseTokenCache: GoogleTokenRecord | null | undefined;

function readStaticConfig() {
  const googleClientId =
    runtimeConfig.googleClientId ??
    process.env.GOOGLE_OAUTH_CLIENT_ID ??
    process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret =
    runtimeConfig.googleClientSecret ??
    process.env.GOOGLE_OAUTH_CLIENT_SECRET ??
    process.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken =
    runtimeConfig.googleRefreshToken ?? process.env.GOOGLE_REFRESH_TOKEN;
  const googleGmailClientId =
    runtimeConfig.googleGmailClientId ??
    googleClientId ??
    process.env.GOOGLE_GMAIL_CLIENT_ID;
  const googleGmailClientSecret =
    runtimeConfig.googleGmailClientSecret ??
    googleClientSecret ??
    process.env.GOOGLE_GMAIL_CLIENT_SECRET;
  const googleGmailRefreshToken =
    runtimeConfig.googleGmailRefreshToken ??
    googleRefreshToken ??
    process.env.GOOGLE_GMAIL_REFRESH_TOKEN;

  return {
    googleClientId,
    googleClientSecret,
    googleRefreshToken,
    googleGmailClientId,
    googleGmailClientSecret,
    googleGmailRefreshToken,
  };
}

async function loadTokensFromDatabase() {
  if (!process.env.DATABASE_URL) {
    databaseTokenCache = null;
    return databaseTokenCache;
  }

  if (databaseTokenCache !== undefined) {
    return databaseTokenCache;
  }

  try {
    const { db } = await import("@workspace/db");
    const { googleAuthTokensTable } = await import("@workspace/db/schema");
    const [row] = await db
      .select()
      .from(googleAuthTokensTable)
      .where(eq(googleAuthTokensTable.id, GOOGLE_TOKEN_ROW_ID))
      .limit(1);

    databaseTokenCache = row
      ? {
          calendarRefreshToken: row.calendarRefreshToken,
          gmailRefreshToken: row.gmailRefreshToken,
        }
      : null;
  } catch {
    databaseTokenCache = null;
  }

  return databaseTokenCache;
}

async function readConfig() {
  const staticConfig = readStaticConfig();
  const storedTokens = await loadTokensFromDatabase();

  return {
    ...staticConfig,
    googleRefreshToken:
      runtimeConfig.googleRefreshToken ??
      storedTokens?.calendarRefreshToken ??
      staticConfig.googleRefreshToken,
    googleGmailRefreshToken:
      runtimeConfig.googleGmailRefreshToken ??
      storedTokens?.gmailRefreshToken ??
      staticConfig.googleGmailRefreshToken,
  };
}

function getTokenErrorMessage(
  data: { error?: string; error_description?: string },
  fallback: string,
) {
  return data.error_description ?? data.error ?? fallback;
}

async function refreshGoogleAccessToken(input: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fallbackErrorMessage: string;
}) {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    refresh_token: input.refreshToken,
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
        `${input.fallbackErrorMessage} with status ${res.status}`,
      ),
    );
  }

  return data.access_token;
}

export function getGoogleWorkspacePrimaryEmail() {
  return process.env.GOOGLE_WORKSPACE_PRIMARY_EMAIL?.trim() || null;
}

export function getGoogleCalendarId() {
  return (
    process.env.GOOGLE_CALENDAR_ID?.trim() ||
    getGoogleWorkspacePrimaryEmail() ||
    "primary"
  );
}

export function getGoogleGmailSendAs() {
  return (
    process.env.GOOGLE_GMAIL_SEND_AS?.trim() ||
    getGoogleWorkspacePrimaryEmail()
  );
}

export function getGoogleOAuthClientCredentials() {
  const { googleClientId, googleClientSecret } = readStaticConfig();

  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth client credentials are incomplete");
  }

  return {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  };
}

export async function hasGoogleOAuthCredentials() {
  const { googleClientId, googleClientSecret, googleRefreshToken } =
    await readConfig();
  return Boolean(googleClientId && googleClientSecret && googleRefreshToken);
}

export async function hasGoogleGmailCredentials() {
  const {
    googleGmailClientId,
    googleGmailClientSecret,
    googleGmailRefreshToken,
  } = await readConfig();
  return Boolean(
    googleGmailClientId &&
      googleGmailClientSecret &&
      googleGmailRefreshToken,
  );
}

export async function getGoogleAccessToken() {
  const { googleClientId, googleClientSecret, googleRefreshToken } =
    await readConfig();

  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    throw new Error("Google OAuth credentials are incomplete");
  }

  return refreshGoogleAccessToken({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    refreshToken: googleRefreshToken,
    fallbackErrorMessage: "OAuth token refresh failed",
  });
}

export async function getGoogleGmailAccessToken() {
  const {
    googleGmailClientId,
    googleGmailClientSecret,
    googleGmailRefreshToken,
  } = await readConfig();

  if (
    !googleGmailClientId ||
    !googleGmailClientSecret ||
    !googleGmailRefreshToken
  ) {
    throw new Error("Google Gmail OAuth credentials are incomplete");
  }

  return refreshGoogleAccessToken({
    clientId: googleGmailClientId,
    clientSecret: googleGmailClientSecret,
    refreshToken: googleGmailRefreshToken,
    fallbackErrorMessage: "Gmail OAuth token refresh failed",
  });
}

export async function getGoogleAccessTokenForRefreshToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleOAuthClientCredentials();
  return refreshGoogleAccessToken({
    clientId,
    clientSecret,
    refreshToken,
    fallbackErrorMessage: "OAuth token refresh failed",
  });
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

export async function googleApiRequestWithAccessToken(
  accessToken: string,
  pathName: string,
  init?: RequestInit,
  baseUrl = "https://www.googleapis.com",
) {
  return fetch(`${baseUrl}${pathName}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function getGoogleAccountEmailForAccessToken(accessToken: string) {
  const res = await googleApiRequestWithAccessToken(
    accessToken,
    "/oauth2/v2/userinfo",
  );
  const data = (await res.json()) as { email?: string };
  return typeof data.email === "string" && data.email.includes("@")
    ? data.email
    : null;
}

export async function getGoogleAccountEmail() {
  if (googleAccountEmailCache !== undefined) {
    return googleAccountEmailCache;
  }

  if (!(await hasGoogleOAuthCredentials())) {
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
  databaseTokenCache = {
    calendarRefreshToken: input.calendarRefreshToken,
    gmailRefreshToken: input.gmailRefreshToken,
  };
  googleAccountEmailCache = undefined;

  if (process.env.DATABASE_URL) {
    const { db } = await import("@workspace/db");
    const { googleAuthTokensTable } = await import("@workspace/db/schema");
    await db
      .insert(googleAuthTokensTable)
      .values({
        id: GOOGLE_TOKEN_ROW_ID,
        calendarRefreshToken: input.calendarRefreshToken,
        gmailRefreshToken: input.gmailRefreshToken,
      })
      .onConflictDoUpdate({
        target: googleAuthTokensTable.id,
        set: {
          calendarRefreshToken: input.calendarRefreshToken,
          gmailRefreshToken: input.gmailRefreshToken,
          updatedAt: new Date(),
        },
      });
    return;
  }

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
