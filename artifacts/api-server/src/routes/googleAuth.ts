import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { mentorProfilesTable, platformGoogleConnectionsTable } from "@workspace/db/schema";
import { logger } from "../lib/logger";
import { hasDatabaseConfig } from "../lib/databaseConfig";
import {
  getGoogleAccountEmailForAccessToken,
  getGoogleConnectionStatus,
  getGooglePrimaryCalendarIdForAccessToken,
  getGoogleOAuthClientCredentials,
  updateStoredGoogleTokens,
} from "../lib/google";
import { upsertMarketingAdditionalCalendar } from "../lib/marketingBookingSettings";
import {
  getPlatformGoogleConnectionMetadata,
  parsePlatformGoogleOAuthState,
} from "../lib/platform/google";
import { verifyAdminSessionToken } from "../lib/adminAuth";

const router: IRouter = Router();

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.send",
];

const STATE_TTL_MS = 10 * 60 * 1000;
const pendingStates = new Map<
  string,
  { expiresAt: number; mode: "primary" | "secondary"; inviteToEvents: boolean }
>();

function getAdminSecret() {
  return process.env.GOOGLE_OAUTH_ADMIN_SECRET;
}

function getRedirectUri(req: Parameters<typeof router.get>[1] extends never ? never : any) {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${req.protocol}://${req.get("host")}/api/google/auth/callback`
  );
}

function secretsMatch(received: string | undefined, expected: string | undefined) {
  if (!received || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function requireAdminSecret(secret: string | undefined) {
  return secretsMatch(secret, getAdminSecret());
}

function getBearerToken(req: Parameters<typeof router.get>[1] extends never ? never : any) {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length).trim();
}

function requireAdminSession(req: Parameters<typeof router.get>[1] extends never ? never : any) {
  return verifyAdminSessionToken(getBearerToken(req));
}

function createAdminGoogleAuthUrl(
  req: Parameters<typeof router.get>[1] extends never ? never : any,
  options?: { mode?: "primary" | "secondary"; inviteToEvents?: boolean },
) {
  pruneExpiredStates();

  const { clientId } = getGoogleOAuthClientCredentials();
  const state = randomBytes(24).toString("hex");
  pendingStates.set(state, {
    expiresAt: Date.now() + STATE_TTL_MS,
    mode: options?.mode ?? "primary",
    inviteToEvents: options?.inviteToEvents ?? false,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function pruneExpiredStates(now = Date.now()) {
  for (const [state, metadata] of pendingStates.entries()) {
    if (metadata.expiresAt <= now) {
      pendingStates.delete(state);
    }
  }
}

router.get("/google/auth/status", (req, res) => {
  if (!requireAdminSecret(req.query.secret?.toString())) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json({
    configured: true,
    redirectUri: getRedirectUri(req),
    scopes: GOOGLE_SCOPES,
    testingModeReminder:
      "If the OAuth app is still in Testing mode, refresh tokens may expire sooner.",
  });
});

router.get("/google/auth/start", (req, res) => {
  if (!requireAdminSecret(req.query.secret?.toString())) {
    return res.status(403).send("Forbidden");
  }

  return res.redirect(createAdminGoogleAuthUrl(req));
});

router.get("/admin/google/auth/status", async (req, res) => {
  if (!requireAdminSession(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const connection = await getGoogleConnectionStatus();

    return res.json({
      ...connection,
      redirectUri: getRedirectUri(req),
      scopes: GOOGLE_SCOPES,
      testingModeReminder:
        "If the OAuth app is still in Testing mode, refresh tokens may expire sooner.",
    });
  } catch (err) {
    logger.error({ err }, "google auth status check failed");
    return res.status(500).json({
      error: "Nie udało się sprawdzić połączenia Google.",
    });
  }
});

router.post("/admin/google/auth/start", (req, res) => {
  if (!requireAdminSession(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({
    authorizationUrl: createAdminGoogleAuthUrl(req),
  });
});

router.post("/admin/google/calendar-connections/start", (req, res) => {
  if (!requireAdminSession(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const inviteToEvents = Boolean(req.body?.inviteToEvents);

  return res.json({
    authorizationUrl: createAdminGoogleAuthUrl(req, {
      mode: "secondary",
      inviteToEvents,
    }),
  });
});

router.get("/google/auth/callback", async (req, res) => {
  pruneExpiredStates();

  const state = req.query.state?.toString();
  const code = req.query.code?.toString();
  const oauthError = req.query.error?.toString();

  if (oauthError) {
    return res
      .status(400)
      .send(`Google OAuth returned an error: ${oauthError}`);
  }

  const platformState = parsePlatformGoogleOAuthState(state);

  if (platformState) {
    if (!code) {
      return res.status(400).send("Missing authorization code.");
    }

    try {
      const { db } = await import("@workspace/db");
      const { clientId, clientSecret } = getGoogleOAuthClientCredentials();
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: getRedirectUri(req),
          grant_type: "authorization_code",
        }).toString(),
      });

      const tokenData = (await tokenRes.json()) as {
        error?: string;
        error_description?: string;
        refresh_token?: string;
        access_token?: string;
        scope?: string;
      };

      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(
          tokenData.error_description ??
            tokenData.error ??
            `OAuth code exchange failed with status ${tokenRes.status}`,
        );
      }

      if (!tokenData.refresh_token) {
        throw new Error(
          "Google did not return a refresh token. Re-run consent with prompt=consent or revoke the previous grant first.",
        );
      }

      const externalEmail =
        platformState.connectionType === "gmail_readonly"
          ? (await getGoogleAccountEmailForAccessToken(tokenData.access_token)) ?? ""
          : (await getGooglePrimaryCalendarIdForAccessToken(tokenData.access_token)) ?? "";

      const [existingConnection] = await db
        .select()
        .from(platformGoogleConnectionsTable)
        .where(
          and(
            eq(platformGoogleConnectionsTable.userId, platformState.userId),
            eq(
              platformGoogleConnectionsTable.connectionType,
              platformState.connectionType,
            ),
          ),
        )
        .limit(1);

      const currentRow = existingConnection ?? null;
      const currentMetadata = getPlatformGoogleConnectionMetadata(
        currentRow?.metadata,
      );

      await db
        .insert(platformGoogleConnectionsTable)
        .values({
          userId: platformState.userId,
          connectionType: platformState.connectionType,
          status: "connected",
          externalEmail: externalEmail || null,
          scopes: tokenData.scope?.split(/\s+/).filter(Boolean) ?? [],
          metadata: {
            ...currentMetadata,
            connectedAt: new Date().toISOString(),
            externalEmail: externalEmail || undefined,
            refreshToken: tokenData.refresh_token,
          },
        })
        .onConflictDoUpdate({
          target: [
            platformGoogleConnectionsTable.userId,
            platformGoogleConnectionsTable.connectionType,
          ] as never,
          set: {
            status: "connected",
            externalEmail: externalEmail || null,
            scopes: tokenData.scope?.split(/\s+/).filter(Boolean) ?? [],
            metadata: {
              ...currentMetadata,
              connectedAt: new Date().toISOString(),
              externalEmail: externalEmail || undefined,
              refreshToken: tokenData.refresh_token,
            },
            updatedAt: new Date(),
          },
        });

      if (platformState.connectionType === "calendar") {
        await db
          .insert(mentorProfilesTable)
          .values({
            userId: platformState.userId,
            googleCalendarEmail: externalEmail || null,
          })
          .onConflictDoUpdate({
            target: mentorProfilesTable.userId,
            set: {
              googleCalendarEmail: externalEmail || null,
              updatedAt: new Date(),
            },
          });
      }

      logger.info(
        {
          connectionType: platformState.connectionType,
          externalEmail,
          scopes: tokenData.scope,
          userId: platformState.userId,
        },
        "Platform mentor Google OAuth connection updated",
      );

      const platformAppUrl =
        process.env.PLATFORM_APP_URL?.trim().replace(/\/$/, "") ??
        `${req.protocol}://${req.get("host")}`;
      return res.redirect(
        `${platformAppUrl}/?googleConnection=${encodeURIComponent(
          platformState.connectionType,
        )}-connected`,
      );
    } catch (err) {
      logger.error({ err }, "platform google oauth callback failed");
      return res.status(500).send("Platform Google OAuth callback failed.");
    }
  }

  if (!state || !pendingStates.has(state)) {
    return res.status(400).send("Invalid or expired OAuth state.");
  }

  const pendingState = pendingStates.get(state)!;
  pendingStates.delete(state);

  if (!code) {
    return res.status(400).send("Missing authorization code.");
  }

  try {
    const { clientId, clientSecret } = getGoogleOAuthClientCredentials();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(req),
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
      refresh_token?: string;
      scope?: string;
    };

    if (!tokenRes.ok) {
      throw new Error(
        tokenData.error_description ??
          tokenData.error ??
          `OAuth code exchange failed with status ${tokenRes.status}`,
      );
    }

    if (!tokenData.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Re-run consent with prompt=consent or revoke the previous grant first.",
      );
    }

    if (pendingState.mode === "secondary") {
      if (!hasDatabaseConfig()) {
        throw new Error("Database config is required for additional calendars.");
      }

      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error("Google did not return an access token.");
      }

      const externalEmail =
        (await getGooglePrimaryCalendarIdForAccessToken(accessToken)) ?? "";

      if (!externalEmail) {
        throw new Error("Nie udało się odczytać adresu dodatkowego kalendarza.");
      }

      await upsertMarketingAdditionalCalendar({
        email: externalEmail,
        refreshToken: tokenData.refresh_token,
        inviteToEvents: pendingState.inviteToEvents,
      });

      return res.send(`
        <html>
          <body style="font-family: sans-serif; padding: 32px; line-height: 1.5;">
            <h1>Dodatkowy kalendarz został połączony</h1>
            <p>Konto <code>${externalEmail}</code> zostało dodane do sprawdzania dostępności.</p>
            <p>Możesz zamknąć tę kartę i wrócić do panelu.</p>
          </body>
        </html>
      `);
    }

    await updateStoredGoogleTokens({
      calendarRefreshToken: tokenData.refresh_token,
      gmailRefreshToken: tokenData.refresh_token,
    });

    const storageTarget = hasDatabaseConfig()
      ? "the database and the running server"
      : ".env.local and the running server";

    logger.info(
      { scopes: tokenData.scope },
      "Google OAuth refresh token updated via admin callback",
    );

    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 32px; line-height: 1.5;">
          <h1>Google connected successfully</h1>
          <p>The refresh token has been saved to <code>${storageTarget}</code>.</p>
          <p>You can close this tab.</p>
        </body>
      </html>
    `);
  } catch (err) {
    logger.error({ err }, "google oauth callback failed");
    return res.status(500).send("Google OAuth callback failed.");
  }
});

export default router;
