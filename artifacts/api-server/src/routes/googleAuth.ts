import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  getGoogleOAuthClientCredentials,
  updateStoredGoogleTokens,
} from "../lib/google";

const router: IRouter = Router();

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.send",
];

const STATE_TTL_MS = 10 * 60 * 1000;
const pendingStates = new Map<string, number>();

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

function pruneExpiredStates(now = Date.now()) {
  for (const [state, expiresAt] of pendingStates.entries()) {
    if (expiresAt <= now) {
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

  pruneExpiredStates();

  const { clientId } = getGoogleOAuthClientCredentials();
  const state = randomBytes(24).toString("hex");
  pendingStates.set(state, Date.now() + STATE_TTL_MS);

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

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
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

  if (!state || !pendingStates.has(state)) {
    return res.status(400).send("Invalid or expired OAuth state.");
  }

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

    await updateStoredGoogleTokens({
      calendarRefreshToken: tokenData.refresh_token,
      gmailRefreshToken: tokenData.refresh_token,
    });

    const storageTarget = process.env.DATABASE_URL
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
