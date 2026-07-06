import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const PLATFORM_GOOGLE_SCOPES_BY_CONNECTION_TYPE = {
  calendar: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
  ],
  gmail_readonly: [
    "https://www.googleapis.com/auth/gmail.readonly",
  ],
} as const;

const PLATFORM_GOOGLE_STATE_TTL_MS = 1000 * 60 * 10;

type PlatformGoogleOAuthStatePayload = {
  connectionType: "calendar" | "gmail_readonly";
  exp: number;
  nonce: string;
  purpose: "platform-google-connect";
  userId: number;
};

export type PlatformGoogleConnectionMetadata = {
  connectedAt?: string;
  externalEmail?: string;
  refreshToken?: string;
};

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function getPlatformGoogleStateSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.GOOGLE_OAUTH_ADMIN_SECRET?.trim() ||
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    null
  );
}

export function createPlatformGoogleOAuthState(input: {
  connectionType: "calendar" | "gmail_readonly";
  userId: number;
}) {
  const secret = getPlatformGoogleStateSecret();
  if (!secret) {
    throw new Error(
      "A platform Google OAuth state secret is required.",
    );
  }

  const payload: PlatformGoogleOAuthStatePayload = {
    connectionType: input.connectionType,
    exp: Date.now() + PLATFORM_GOOGLE_STATE_TTL_MS,
    nonce: randomBytes(12).toString("hex"),
    purpose: "platform-google-connect",
    userId: input.userId,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest();
  return `platform.${encodedPayload}.${toBase64Url(signature)}`;
}

export function parsePlatformGoogleOAuthState(
  token: string | undefined,
): PlatformGoogleOAuthStatePayload | null {
  const secret = getPlatformGoogleStateSecret();
  if (!token || !secret || !token.startsWith("platform.")) {
    return null;
  }

  const [, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  const receivedSignature = fromBase64Url(encodedSignature);

  if (expectedSignature.length !== receivedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as PlatformGoogleOAuthStatePayload;

    if (
      payload.purpose !== "platform-google-connect" ||
      !Number.isFinite(payload.userId) ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now() ||
      (payload.connectionType !== "calendar" &&
        payload.connectionType !== "gmail_readonly")
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getPlatformGoogleConnectionMetadata(
  value: unknown,
): PlatformGoogleConnectionMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  const input = value as Record<string, unknown>;
  return {
    connectedAt:
      typeof input.connectedAt === "string" ? input.connectedAt : undefined,
    externalEmail:
      typeof input.externalEmail === "string" ? input.externalEmail : undefined,
    refreshToken:
      typeof input.refreshToken === "string" ? input.refreshToken : undefined,
  };
}

export function buildMentorMeetingUrl(input: {
  generatedGoogleMeetUrl?: string | null;
  meetingLink?: string | null;
  meetingMethod?: string | null;
  whatsappNumber?: string | null;
}) {
  if (input.meetingMethod === "google_meet" && input.generatedGoogleMeetUrl) {
    return input.generatedGoogleMeetUrl;
  }

  if (input.meetingMethod === "whatsapp") {
    const digits = (input.whatsappNumber ?? "").replace(/\D+/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }

  const trimmedLink = input.meetingLink?.trim();
  return trimmedLink ? trimmedLink : null;
}
