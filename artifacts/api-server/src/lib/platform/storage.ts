export type R2Config = {
  accessKeyId: string;
  accountId: string;
  bucket: string;
  endpoint: string;
  secretAccessKey: string;
};

export function getR2Config(): R2Config | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const endpoint = process.env.R2_ENDPOINT?.trim();

  if (!accessKeyId || !secretAccessKey || !accountId || !bucket || !endpoint) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    accountId,
    bucket,
    endpoint,
  };
}

export function getPlatformStorageSummary() {
  const config = getR2Config();
  return {
    configured: Boolean(config),
    bucket: config?.bucket ?? null,
    endpoint: config?.endpoint ?? null,
  };
}
