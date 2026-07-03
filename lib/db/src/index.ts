import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required database environment variable: ${name}`);
  }

  return value;
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return 5432;
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PGPORT value: "${rawPort}"`);
  }

  return port;
}

function resolveSslMode() {
  const sslMode = process.env.PGSSLMODE?.toLowerCase();

  if (!sslMode || sslMode === "disable") {
    return undefined;
  }

  if (sslMode === "no-verify") {
    return { rejectUnauthorized: false };
  }

  if (
    sslMode === "prefer" ||
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full"
  ) {
    return true;
  }

  throw new Error(`Unsupported PGSSLMODE value: "${sslMode}"`);
}

const ssl = resolveSslMode();
const poolConfig = {
  host: requireEnv("PGHOST"),
  port: parsePort(process.env.PGPORT),
  database: requireEnv("PGDATABASE"),
  user: requireEnv("PGUSER"),
  password: requireEnv("PGPASSWORD"),
  ...(ssl ? { ssl } : {}),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
