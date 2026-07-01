import { createHmac, createHash } from "node:crypto";
import { Router } from "express";
import { getR2Config } from "../lib/platform/storage";

const router = Router();
const R2_REGION = "auto";
const R2_SERVICE = "s3";
const R2_ALGORITHM = "AWS4-HMAC-SHA256";
const PRESIGN_EXPIRES_SECONDS = 60 * 60;

function encodeR2Path(key: string) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function buildPresignedR2Url(key: string) {
  const config = getR2Config();
  if (!config) {
    return null;
  }

  const endpointUrl = new URL(config.endpoint);
  const host = endpointUrl.host;
  const pathnamePrefix = endpointUrl.pathname.replace(/\/+$/, "");
  const canonicalUri = `${pathnamePrefix}/${config.bucket}/${encodeR2Path(key)}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;

  const query = new URLSearchParams({
    "X-Amz-Algorithm": R2_ALGORITHM,
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(PRESIGN_EXPIRES_SECONDS),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalQueryString = Array.from(query.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([paramKey, value]) =>
        `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    R2_ALGORITHM,
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), R2_REGION),
      R2_SERVICE,
    ),
    "aws4_request",
  );

  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return `${endpointUrl.origin}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

router.get("/media/r2", (req, res) => {
  const key = typeof req.query.key === "string" ? req.query.key.trim() : "";
  if (!key) {
    res.status(400).json({ error: "Missing media key" });
    return;
  }

  const signedUrl = buildPresignedR2Url(key);
  if (!signedUrl) {
    res.status(503).json({ error: "Storage is not configured" });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  res.redirect(signedUrl);
});

export default router;
