import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { platformSessionsTable, platformUsersTable } from "@workspace/db/schema";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const RESET_TTL_MS = 1000 * 60 * 30;

function toBase64Url(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken() {
  return toBase64Url(randomBytes(32));
}

export function createPasswordResetToken() {
  const token = createOpaqueToken();
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  };
}

export async function createPlatformSession(userId: number) {
  const { db } = await import("@workspace/db");
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(platformSessionsTable).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function deletePlatformSession(token: string | undefined) {
  if (!token) {
    return;
  }

  const { db } = await import("@workspace/db");
  await db
    .delete(platformSessionsTable)
    .where(eq(platformSessionsTable.tokenHash, hashToken(token)));
}

export async function getPlatformSessionUser(token: string | undefined) {
  if (!token) {
    return null;
  }

  const { db } = await import("@workspace/db");
  const tokenHash = hashToken(token);
  const [session] = await db
    .select({
      userId: platformSessionsTable.userId,
    })
    .from(platformSessionsTable)
    .where(
      and(
        eq(platformSessionsTable.tokenHash, tokenHash),
        gt(platformSessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const [user] = await db
    .select()
    .from(platformUsersTable)
    .where(eq(platformUsersTable.id, session.userId))
    .limit(1);

  return user ?? null;
}

export function getPlatformBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length).trim();
}

export function stringsEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
