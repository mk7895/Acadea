function hasDirectConnectionString() {
  return Boolean(process.env.DATABASE_URL);
}

function hasSocketConnectionConfig() {
  return Boolean(
    process.env.PGHOST &&
      process.env.PGDATABASE &&
      process.env.PGUSER &&
      process.env.PGPASSWORD,
  );
}

export function hasDatabaseConfig() {
  return hasDirectConnectionString() || hasSocketConnectionConfig();
}
