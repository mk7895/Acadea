import { defineConfig } from "drizzle-kit";
import path from "path";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required database environment variable: ${name}`);
  }

  return value;
}

function parsePort(rawPort: string | undefined) {
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
    return "require";
  }

  if (
    sslMode === "prefer" ||
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full"
  ) {
    return sslMode;
  }

  throw new Error(`Unsupported PGSSLMODE value: "${sslMode}"`);
}

const ssl = resolveSslMode();
const dbCredentials = {
  host: requireEnv("PGHOST"),
  port: parsePort(process.env.PGPORT),
  user: requireEnv("PGUSER"),
  password: requireEnv("PGPASSWORD"),
  database: requireEnv("PGDATABASE"),
  ...(ssl ? { ssl } : {}),
};

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials,
});
