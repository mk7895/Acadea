function hasSocketConnectionConfig() {
  return Boolean(
    process.env.PGHOST &&
      process.env.PGDATABASE &&
      process.env.PGUSER &&
      process.env.PGPASSWORD,
  );
}

export function hasDatabaseConfig() {
  return hasSocketConnectionConfig();
}
