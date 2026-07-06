import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.GOOGLE_OAUTH_ADMIN_SECRET;
}

function getPasswordPepper() {
  return process.env.PLATFORM_PASSWORD_PEPPER?.trim() || "";
}

export function getAdminEntrySecret() {
  return process.env.ADMIN_PANEL_SECRET ?? process.env.GOOGLE_OAUTH_ADMIN_SECRET;
}

export function secretsMatch(received: string | undefined, expected: string | undefined) {
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

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(`${password}${getPasswordPepper()}`, salt, 64).toString("hex");
  return {
    salt,
    hash,
  };
}

export function verifyPassword(password: string, passwordSalt: string, passwordHash: string) {
  const stored = Buffer.from(passwordHash, "hex");
  const candidates = [
    scryptSync(`${password}${getPasswordPepper()}`, passwordSalt, 64),
    scryptSync(password, passwordSalt, 64),
  ];

  if (candidates[0].length !== stored.length) {
    return false;
  }

  return candidates.some((candidate) => timingSafeEqual(candidate, stored));
}

export function createAdminSessionToken() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET or GOOGLE_OAUTH_ADMIN_SECRET must be set.");
  }

  const payload = {
    role: "admin",
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();

  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  const secret = getSessionSecret();
  if (!token || !secret) {
    return false;
  }

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  const receivedSignature = fromBase64Url(encodedSignature);

  if (expectedSignature.length !== receivedSignature.length) {
    return false;
  }

  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as {
      role?: string;
      exp?: number;
    };

    return payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
