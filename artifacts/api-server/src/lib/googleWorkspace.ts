import { createSign, randomUUID } from "node:crypto";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const GOOGLE_DOCS_API_BASE = "https://docs.googleapis.com/v1";
const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";
const GOOGLE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const GOOGLE_SHORTCUT_MIME_TYPE = "application/vnd.google-apps.shortcut";

type GoogleServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri?: string;
};

type GoogleWorkspaceTokenCacheEntry = {
  accessToken: string;
  expiresAt: number;
  scopeKey: string;
};

type DriveFileRecord = {
  id: string;
  mimeType?: string;
  name?: string;
  webViewLink?: string;
};

let cachedWorkspaceToken: GoogleWorkspaceTokenCacheEntry | null = null;

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildGoogleViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function buildGoogleFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

function buildGoogleDocUrl(documentId: string) {
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

function buildGoogleDocTabUrl(documentId: string, tabId: string) {
  return `${buildGoogleDocUrl(documentId)}?tab=${encodeURIComponent(tabId)}`;
}

function parseGoogleServiceAccountCredentials(): GoogleServiceAccountCredentials | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GoogleServiceAccountCredentials>;
    if (!parsed.client_email || !parsed.private_key) {
      return null;
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
      project_id: parsed.project_id,
      token_uri: parsed.token_uri,
    };
  } catch {
    return null;
  }
}

export function hasGoogleWorkspaceServiceAccount() {
  return Boolean(parseGoogleServiceAccountCredentials());
}

export function getGoogleSharedDriveId() {
  return process.env.GOOGLE_SHARED_DRIVE_ID?.trim() || null;
}

function createSignedJwt(input: {
  audience: string;
  clientEmail: string;
  privateKey: string;
  scope: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    aud: input.audience,
    exp: now + 3600,
    iat: now,
    iss: input.clientEmail,
    scope: input.scope,
  };

  const unsignedToken = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(input.privateKey);
  return `${unsignedToken}.${toBase64Url(signature)}`;
}

async function getGoogleWorkspaceAccessToken(scopes: string[]) {
  const credentials = parseGoogleServiceAccountCredentials();
  if (!credentials) {
    throw new Error("Google Workspace service account is not configured.");
  }

  const scopeKey = [...scopes].sort().join(" ");
  if (
    cachedWorkspaceToken &&
    cachedWorkspaceToken.scopeKey === scopeKey &&
    cachedWorkspaceToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedWorkspaceToken.accessToken;
  }

  const assertion = createSignedJwt({
    audience: credentials.token_uri || GOOGLE_OAUTH_TOKEN_URL,
    clientEmail: credentials.client_email,
    privateKey: credentials.private_key,
    scope: scopeKey,
  });

  const body = new URLSearchParams({
    assertion,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  });

  const response = await fetch(credentials.token_uri || GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        `Google Workspace token request failed with status ${response.status}.`,
    );
  }

  cachedWorkspaceToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(300, Number(data.expires_in ?? 3600) - 60) * 1000,
    scopeKey,
  };

  return data.access_token;
}

async function googleWorkspaceFetch(
  url: string,
  init: RequestInit | undefined,
  scopes: string[],
) {
  const accessToken = await getGoogleWorkspaceAccessToken(scopes);
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

async function googleWorkspaceJson<T>(
  url: string,
  init: RequestInit | undefined,
  scopes: string[],
) {
  const response = await googleWorkspaceFetch(url, init, scopes);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Google Workspace request failed with status ${response.status}: ${body.slice(0, 400)}`,
    );
  }

  return (await response.json()) as T;
}

export function parseGoogleDriveId(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw) && !raw.includes("/")) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) {
      return folderMatch[1];
    }
    const fileMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch?.[1]) {
      return fileMatch[1];
    }
    const queryId = url.searchParams.get("id");
    if (queryId) {
      return queryId;
    }
  } catch {
    return null;
  }

  return null;
}

export async function createDriveFolder(input: {
  name: string;
  parentId?: string | null;
}) {
  const body = {
    mimeType: GOOGLE_FOLDER_MIME_TYPE,
    name: input.name,
    ...(input.parentId ? { parents: [input.parentId] } : {}),
  };

  const record = await googleWorkspaceJson<DriveFileRecord>(
    `${GOOGLE_DRIVE_API_BASE}/files?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    ["https://www.googleapis.com/auth/drive"],
  );

  return {
    id: record.id,
    url: record.webViewLink || buildGoogleFolderUrl(record.id),
  };
}

export async function createGoogleDocument(input: {
  name: string;
  parentId?: string | null;
}) {
  const body = {
    mimeType: GOOGLE_DOC_MIME_TYPE,
    name: input.name,
    ...(input.parentId ? { parents: [input.parentId] } : {}),
  };

  const record = await googleWorkspaceJson<DriveFileRecord>(
    `${GOOGLE_DRIVE_API_BASE}/files?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/documents"],
  );

  return {
    id: record.id,
    url: buildGoogleDocUrl(record.id),
  };
}

export async function shareDriveItemWithUser(input: {
  fileId: string;
  emailAddress: string;
  role?: "reader" | "commenter" | "writer";
}) {
  await googleWorkspaceJson(
    `${GOOGLE_DRIVE_API_BASE}/files/${encodeURIComponent(
      input.fileId,
    )}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailAddress: input.emailAddress,
        role: input.role || "writer",
        type: "user",
      }),
    },
    ["https://www.googleapis.com/auth/drive"],
  );
}

export async function createDriveShortcut(input: {
  name: string;
  parentId: string;
  targetId: string;
}) {
  const record = await googleWorkspaceJson<DriveFileRecord>(
    `${GOOGLE_DRIVE_API_BASE}/files?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mimeType: GOOGLE_SHORTCUT_MIME_TYPE,
        name: input.name,
        parents: [input.parentId],
        shortcutDetails: {
          targetId: input.targetId,
        },
      }),
    },
    ["https://www.googleapis.com/auth/drive"],
  );

  return {
    id: record.id,
    url: record.webViewLink || buildGoogleViewUrl(record.id),
  };
}

export async function uploadFileToDrive(input: {
  data: Buffer;
  fileName: string;
  mimeType: string;
  parentId: string;
}) {
  const metadata = {
    name: input.fileName,
    parents: [input.parentId],
  };
  const boundary = `acadea-${randomUUID()}`;
  const metadataPart = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata,
    )}\r\n`,
    "utf8",
  );
  const fileHeader = Buffer.from(
    `--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`,
    "utf8",
  );
  const closing = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const body = Buffer.concat([metadataPart, fileHeader, input.data, closing]);

  const record = await googleWorkspaceJson<DriveFileRecord>(
    `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,webViewLink`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
    ["https://www.googleapis.com/auth/drive"],
  );

  return {
    id: record.id,
    url: record.webViewLink || buildGoogleViewUrl(record.id),
  };
}

export async function createDocumentTab(input: {
  documentId: string;
  title: string;
  initialText?: string | null;
}) {
  const createResponse = await googleWorkspaceJson<{
    replies?: Array<{
      addDocumentTab?: {
        tabProperties?: {
          tabId?: string;
          title?: string;
        };
      };
    }>;
  }>(
    `${GOOGLE_DOCS_API_BASE}/documents/${encodeURIComponent(input.documentId)}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            addDocumentTab: {
              tabProperties: {
                title: input.title,
              },
            },
          },
        ],
      }),
    },
    ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
  );

  const tabId =
    createResponse.replies?.[0]?.addDocumentTab?.tabProperties?.tabId;
  if (!tabId) {
    throw new Error("Google Docs did not return the new tab ID.");
  }

  const initialText = input.initialText?.trim();
  if (initialText) {
    await googleWorkspaceJson(
      `${GOOGLE_DOCS_API_BASE}/documents/${encodeURIComponent(input.documentId)}:batchUpdate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                endOfSegmentLocation: {
                  tabId,
                },
                text: `${initialText}\n\n`,
              },
            },
          ],
        }),
      },
      ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
    );
  }

  return {
    tabId,
    tabUrl: buildGoogleDocTabUrl(input.documentId, tabId),
    title: input.title,
  };
}

export async function getDriveFileMetadata(fileId: string) {
  const record = await googleWorkspaceJson<DriveFileRecord>(
    `${GOOGLE_DRIVE_API_BASE}/files/${encodeURIComponent(
      fileId,
    )}?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`,
    undefined,
    ["https://www.googleapis.com/auth/drive"],
  );

  return {
    id: record.id,
    name: record.name || "",
    mimeType: record.mimeType || "",
    url:
      record.webViewLink ||
      (record.mimeType === GOOGLE_FOLDER_MIME_TYPE
        ? buildGoogleFolderUrl(record.id)
        : buildGoogleViewUrl(record.id)),
  };
}
