import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const ENV_DATABASE_PATH = path.join(ROOT, ".env.database");

const ALLOWED_TABLES = new Set([
  "contact_submissions",
  "mentor_applications",
  "scholarship_applications",
  "newsletter_signups",
  "booking_leads",
  "google_auth_tokens",
]);

function parseEnv(text: string) {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function loadDatabaseUrl() {
  let envText: string;
  try {
    envText = await readFile(ENV_DATABASE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Missing ${ENV_DATABASE_PATH}. Create it from .env.database.example and set PGHOST/PGDATABASE/PGUSER/PGPASSWORD.`,
      );
    }
    throw error;
  }
  const env = parseEnv(envText);
  const host = env.PGHOST?.trim();
  const database = env.PGDATABASE?.trim();
  const user = env.PGUSER?.trim();
  const password = env.PGPASSWORD?.trim();

  if (!host || !database || !user || !password) {
    throw new Error(
      `Database config is incomplete in ${ENV_DATABASE_PATH}. Set PGHOST/PGDATABASE/PGUSER/PGPASSWORD.`,
    );
  }

  const port = env.PGPORT?.trim() || "5432";
  const sslMode = env.PGSSLMODE?.trim();
  const url = new URL(`postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@placeholder/${database}`);

  url.hostname = host;
  url.port = port;

  if (sslMode && sslMode.toLowerCase() !== "disable") {
    url.searchParams.set("sslmode", sslMode);
  }

  return url.toString();
}

function printHelp() {
  console.log(`
Usage:
  pnpm db:read tables
  pnpm db:read <table_name> [limit]

Allowed tables:
  contact_submissions
  mentor_applications
  scholarship_applications
  newsletter_signups
  booking_leads
  google_auth_tokens

Examples:
  pnpm db:read tables
  pnpm db:read newsletter_signups
  pnpm db:read booking_leads 25
`.trim());
}

async function main() {
  const command = process.argv[2];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const databaseUrl = await loadDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    if (command === "tables") {
      const result = await client.query(`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
        order by table_name;
      `);
      console.table(result.rows);
      return;
    }

    if (!ALLOWED_TABLES.has(command)) {
      throw new Error(
        `Unsupported table "${command}". Run "pnpm db:read tables" or see --help.`,
      );
    }

    const parsedLimit = Number(process.argv[3] ?? "20");
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), 200)
      : 20;

    const result = await client.query(
      `select * from ${command} order by id desc limit ${limit};`,
    );
    console.table(result.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to read database");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
