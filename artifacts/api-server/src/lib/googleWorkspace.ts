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
  createdTime?: string;
  id: string;
  mimeType?: string;
  modifiedTime?: string;
  name?: string;
  parents?: string[];
  size?: string;
  webViewLink?: string;
};

export type DriveFolderFileEntry = {
  createdTime: string | null;
  id: string;
  mimeType: string;
  modifiedTime: string | null;
  name: string;
  parentId: string | null;
  sizeBytes: number;
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

type GoogleDocsTextRun = {
  content?: string;
  textStyle?: Record<string, unknown>;
};

type GoogleDocsParagraphElement = {
  textRun?: GoogleDocsTextRun;
};

type GoogleDocsStructuralElement = {
  endIndex?: number;
  startIndex?: number;
  paragraph?: {
    elements?: GoogleDocsParagraphElement[];
    bullet?: {
      listId?: string;
      nestingLevel?: number;
    };
    paragraphStyle?: Record<string, unknown>;
  };
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{
        content?: GoogleDocsStructuralElement[];
      }>;
    }>;
  };
  tableOfContents?: {
    content?: GoogleDocsStructuralElement[];
  };
};

type GoogleDocsHeader = {
  content?: GoogleDocsStructuralElement[];
  headerId?: string;
};

type GoogleDocsFooter = {
  content?: GoogleDocsStructuralElement[];
  footerId?: string;
};

type GoogleDocsDocumentStyle = {
  defaultFooterId?: string;
  defaultHeaderId?: string;
  flipPageOrientation?: boolean;
  marginBottom?: Record<string, unknown>;
  marginFooter?: Record<string, unknown>;
  marginHeader?: Record<string, unknown>;
  marginLeft?: Record<string, unknown>;
  marginRight?: Record<string, unknown>;
  marginTop?: Record<string, unknown>;
  pageSize?: Record<string, unknown>;
  useEvenPageHeaderFooter?: boolean;
  useFirstPageHeaderFooter?: boolean;
};

type GoogleDocsTab = {
  childTabs?: GoogleDocsTab[];
  documentTab?: {
    body?: {
      content?: GoogleDocsStructuralElement[];
    };
    documentStyle?: GoogleDocsDocumentStyle;
    footers?: Record<string, GoogleDocsFooter>;
    headers?: Record<string, GoogleDocsHeader>;
  };
  tabProperties?: {
    tabId?: string;
    title?: string;
  };
};

type GoogleDocsDocument = {
  lists?: Record<
    string,
    {
      listProperties?: {
        nestingLevels?: Array<{
          glyphType?: string;
        }>;
      };
    }
  >;
  tabs?: GoogleDocsTab[];
};

type GoogleDocsTabSummary = {
  tabId: string;
  title: string;
  url: string;
};

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

export async function findDriveDocuments(input: {
  mimeType?: string;
  name: string;
  parentId?: string | null;
}) {
  const queryParts = [
    `name = '${input.name.replace(/'/g, "\\'")}'`,
    "trashed = false",
  ];
  if (input.mimeType) {
    queryParts.push(`mimeType = '${input.mimeType}'`);
  }
  if (input.parentId) {
    queryParts.push(`'${input.parentId}' in parents`);
  }

  const search = await googleWorkspaceJson<{
    files?: DriveFileRecord[];
  }>(
    `${GOOGLE_DRIVE_API_BASE}/files?supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,webViewLink)&q=${encodeURIComponent(
      queryParts.join(" and "),
    )}`,
    undefined,
    ["https://www.googleapis.com/auth/drive"],
  );

  return (search.files ?? []).map((file) => ({
    id: file.id,
    mimeType: file.mimeType ?? "",
    name: file.name ?? "",
    url:
      file.webViewLink ||
      (file.mimeType === GOOGLE_DOC_MIME_TYPE
        ? buildGoogleDocUrl(file.id)
        : file.mimeType === GOOGLE_FOLDER_MIME_TYPE
          ? buildGoogleFolderUrl(file.id)
          : buildGoogleViewUrl(file.id)),
  }));
}

export async function getDriveFolderUsageBytes(folderId: string) {
  const normalizedFolderId = parseGoogleDriveId(folderId);
  if (!normalizedFolderId) {
    return 0;
  }

  let totalBytes = 0;
  const queue = [normalizedFolderId];
  const seenFolders = new Set<string>();

  while (queue.length) {
    const currentFolderId = queue.shift();
    if (!currentFolderId || seenFolders.has(currentFolderId)) {
      continue;
    }
    seenFolders.add(currentFolderId);

    let pageToken: string | undefined;
    do {
      const query = [
        `'${currentFolderId}' in parents`,
        "trashed = false",
      ].join(" and ");
      const response = await googleWorkspaceJson<{
        files?: DriveFileRecord[];
        nextPageToken?: string;
      }>(
        `${GOOGLE_DRIVE_API_BASE}/files?supportsAllDrives=true&includeItemsFromAllDrives=true&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000&q=${encodeURIComponent(
          query,
        )}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
        undefined,
        ["https://www.googleapis.com/auth/drive"],
      );

      for (const file of response.files ?? []) {
        if (file.mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          queue.push(file.id);
          continue;
        }
        totalBytes += Number(file.size ?? 0);
      }

      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  return totalBytes;
}

export async function listDriveFolderFiles(folderId: string): Promise<DriveFolderFileEntry[]> {
  const normalizedFolderId = parseGoogleDriveId(folderId);
  if (!normalizedFolderId) {
    return [];
  }

  const files: DriveFolderFileEntry[] = [];
  const queue = [normalizedFolderId];
  const seenFolders = new Set<string>();

  while (queue.length) {
    const currentFolderId = queue.shift();
    if (!currentFolderId || seenFolders.has(currentFolderId)) {
      continue;
    }
    seenFolders.add(currentFolderId);

    let pageToken: string | undefined;
    do {
      const query = [`'${currentFolderId}' in parents`, "trashed = false"].join(" and ");
      const response = await googleWorkspaceJson<{
        files?: DriveFileRecord[];
        nextPageToken?: string;
      }>(
        `${GOOGLE_DRIVE_API_BASE}/files?supportsAllDrives=true&includeItemsFromAllDrives=true&fields=nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents)&pageSize=1000&q=${encodeURIComponent(
          query,
        )}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
        undefined,
        ["https://www.googleapis.com/auth/drive"],
      );

      for (const file of response.files ?? []) {
        if (file.mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          queue.push(file.id);
          continue;
        }

        files.push({
          createdTime: file.createdTime ?? null,
          id: file.id,
          mimeType: file.mimeType ?? "",
          modifiedTime: file.modifiedTime ?? null,
          name: file.name ?? "",
          parentId: file.parents?.[0] ?? currentFolderId,
          sizeBytes: Number(file.size ?? 0),
        });
      }

      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  return files;
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

export async function trashDriveFile(fileId: string) {
  await googleWorkspaceJson(
    `${GOOGLE_DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trashed: true,
      }),
    },
    ["https://www.googleapis.com/auth/drive"],
  );
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

  try {
    await setDocumentTabPageStyle({
      documentId: input.documentId,
      style: null,
      tabId,
    });
  } catch (error) {
    console.warn("Failed to set default page style for Google Docs tab", {
      documentId: input.documentId,
      error,
      tabId,
    });
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

export async function deleteDocumentTab(input: {
  documentId: string;
  tabId: string;
}) {
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
            deleteTab: {
              tabId: input.tabId,
            },
          },
        ],
      }),
    },
    ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
  );
}

function flattenGoogleDocTabs(tabs: GoogleDocsTab[] | undefined, output: GoogleDocsTab[] = []) {
  for (const tab of tabs ?? []) {
    output.push(tab);
    flattenGoogleDocTabs(tab.childTabs, output);
  }
  return output;
}

async function getDocumentWithTabs(documentId: string) {
  return googleWorkspaceJson<GoogleDocsDocument>(
    `${GOOGLE_DOCS_API_BASE}/documents/${encodeURIComponent(documentId)}?includeTabsContent=true`,
    undefined,
    ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
  );
}

function findGoogleDocTab(document: GoogleDocsDocument, tabId: string) {
  return flattenGoogleDocTabs(document.tabs).find(
    (entry) => entry.tabProperties?.tabId === tabId,
  );
}

function extractTextFromGoogleDocElements(elements: GoogleDocsStructuralElement[] | undefined): string {
  let text = "";
  for (const element of elements ?? []) {
    if (element.paragraph?.elements) {
      text += element.paragraph.elements
        .map((paragraphElement) => paragraphElement.textRun?.content ?? "")
        .join("");
    }
    if (element.tableOfContents?.content) {
      text += extractTextFromGoogleDocElements(element.tableOfContents.content);
    }
    if (element.table?.tableRows) {
      for (const row of element.table.tableRows) {
        for (const cell of row.tableCells ?? []) {
          text += extractTextFromGoogleDocElements(cell.content);
        }
      }
    }
  }
  return text;
}

export async function getDocumentTabText(input: {
  documentId: string;
  tabId: string;
}) {
  const document = await getDocumentWithTabs(input.documentId);

  const tab = findGoogleDocTab(document, input.tabId);
  if (!tab) {
    throw new Error("Source Google Docs tab was not found.");
  }

  const text = extractTextFromGoogleDocElements(tab.documentTab?.body?.content).trim();
  return {
    tabId: tab.tabProperties?.tabId ?? input.tabId,
    text,
    title: tab.tabProperties?.title ?? "",
  };
}

export async function listDocumentTabs(documentId: string): Promise<GoogleDocsTabSummary[]> {
  const document = await getDocumentWithTabs(documentId);
  return flattenGoogleDocTabs(document.tabs)
    .map((tab) => {
      const tabId = tab.tabProperties?.tabId?.trim();
      if (!tabId) {
        return null;
      }
      return {
        tabId,
        title: tab.tabProperties?.title?.trim() || "Untitled tab",
        url: buildGoogleDocTabUrl(documentId, tabId),
      };
    })
    .filter((tab): tab is GoogleDocsTabSummary => Boolean(tab));
}

function pickWritableObject(
  source: Record<string, unknown> | undefined,
  allowedKeys: string[],
): Record<string, unknown> | null {
  if (!source) {
    return null;
  }
  const next: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (source[key] !== undefined) {
      next[key] = source[key];
    }
  }
  return Object.keys(next).length ? next : null;
}

function buildFieldMask(value: Record<string, unknown>, prefix = ""): string[] {
  const fields: string[] = [];
  for (const [key, nestedValue] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue) &&
      Object.keys(nestedValue as Record<string, unknown>).length
    ) {
      fields.push(...buildFieldMask(nestedValue as Record<string, unknown>, path));
    } else {
      fields.push(path);
    }
  }
  return fields;
}

function inferBulletPreset(document: GoogleDocsDocument, paragraph: NonNullable<GoogleDocsStructuralElement["paragraph"]>) {
  const listId = paragraph.bullet?.listId;
  const nestingLevel = paragraph.bullet?.nestingLevel ?? 0;
  const glyphType =
    (listId
      ? document.lists?.[listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType
      : "") ?? "";
  const normalized = glyphType.toUpperCase();

  if (!paragraph.bullet) {
    return null;
  }
  if (normalized.includes("DECIMAL")) {
    return "NUMBERED_DECIMAL_NESTED";
  }
  if (normalized.includes("ROMAN")) {
    return "NUMBERED_UPPERROMAN_UPPERALPHA_DECIMAL";
  }
  if (normalized.includes("ALPHA") || normalized.includes("LATIN")) {
    return "NUMBERED_UPPERALPHA_UPPERALPHA_DECIMAL";
  }
  return "BULLET_DISC_CIRCLE_SQUARE";
}

type ClonableParagraph = {
  bulletPreset: string | null;
  paragraphStyle: Record<string, unknown> | null;
  text: string;
  textRuns: Array<{
    endOffset: number;
    startOffset: number;
    textStyle: Record<string, unknown> | null;
  }>;
};

function extractClonableParagraphs(
  document: GoogleDocsDocument,
  elements: GoogleDocsStructuralElement[] | undefined,
): ClonableParagraph[] {
  const paragraphs: ClonableParagraph[] = [];

  for (const element of elements ?? []) {
    if (element.paragraph) {
      let paragraphText = "";
      let cursor = 0;
      const textRuns: ClonableParagraph["textRuns"] = [];

      for (const paragraphElement of element.paragraph.elements ?? []) {
        const content = paragraphElement.textRun?.content ?? "";
        if (!content) {
          continue;
        }
        const textStyle = pickWritableObject(paragraphElement.textRun?.textStyle, [
          "backgroundColor",
          "baselineOffset",
          "bold",
          "fontSize",
          "foregroundColor",
          "italic",
          "link",
          "smallCaps",
          "strikethrough",
          "underline",
          "weightedFontFamily",
        ]);
        textRuns.push({
          endOffset: cursor + content.length,
          startOffset: cursor,
          textStyle,
        });
        paragraphText += content;
        cursor += content.length;
      }

      if (!paragraphText.endsWith("\n")) {
        paragraphText += "\n";
      }

      paragraphs.push({
        bulletPreset: inferBulletPreset(document, element.paragraph),
        paragraphStyle: pickWritableObject(element.paragraph.paragraphStyle, [
          "alignment",
          "avoidWidowAndOrphan",
          "borderBetween",
          "borderBottom",
          "borderLeft",
          "borderRight",
          "borderTop",
          "direction",
          "indentEnd",
          "indentFirstLine",
          "indentStart",
          "keepLinesTogether",
          "keepWithNext",
          "lineSpacing",
          "namedStyleType",
          "pageBreakBefore",
          "shading",
          "spaceAbove",
          "spaceBelow",
          "spacingMode",
        ]),
        text: paragraphText,
        textRuns,
      });
      continue;
    }

    if (element.tableOfContents?.content) {
      paragraphs.push(...extractClonableParagraphs(document, element.tableOfContents.content));
      continue;
    }

    if (element.table?.tableRows) {
      for (const row of element.table.tableRows) {
        for (const cell of row.tableCells ?? []) {
          paragraphs.push(...extractClonableParagraphs(document, cell.content));
        }
      }
    }
  }

  return paragraphs;
}

async function createDefaultHeader(
  documentId: string,
  tabId: string,
) {
  const response = await googleWorkspaceJson<{
    replies?: Array<{
      createHeader?: {
        headerId?: string;
      };
    }>;
  }>(
    `${GOOGLE_DOCS_API_BASE}/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            createHeader: {
              sectionBreakLocation: {
                index: 0,
                tabId,
              },
              type: "DEFAULT",
            },
          },
        ],
        writeControl: undefined,
      }),
    },
    ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
  );

  const headerId = response.replies?.[0]?.createHeader?.headerId;
  if (!headerId) {
    throw new Error("Google Docs did not return the new header ID.");
  }
  return headerId;
}

async function createDefaultFooter(
  documentId: string,
  tabId: string,
) {
  const response = await googleWorkspaceJson<{
    replies?: Array<{
      createFooter?: {
        footerId?: string;
      };
    }>;
  }>(
    `${GOOGLE_DOCS_API_BASE}/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            createFooter: {
              sectionBreakLocation: {
                index: 0,
                tabId,
              },
              type: "DEFAULT",
            },
          },
        ],
      }),
    },
    ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
  );

  const footerId = response.replies?.[0]?.createFooter?.footerId;
  if (!footerId) {
    throw new Error("Google Docs did not return the new footer ID.");
  }
  return footerId;
}

async function batchUpdateDocument(
  documentId: string,
  requests: Array<Record<string, unknown>>,
) {
  if (!requests.length) {
    return;
  }

  await googleWorkspaceJson(
    `${GOOGLE_DOCS_API_BASE}/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    },
    ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
  );
}

async function cloneContentIntoSegment(input: {
  document: GoogleDocsDocument;
  documentId: string;
  elements: GoogleDocsStructuralElement[] | undefined;
  segmentId: string;
  tabId: string;
}) {
  const paragraphs = extractClonableParagraphs(input.document, input.elements);
  const allText = paragraphs.map((paragraph) => paragraph.text).join("");
  if (!allText) {
    return;
  }

  await batchUpdateDocument(input.documentId, [
    {
      insertText: {
        endOfSegmentLocation: {
          segmentId: input.segmentId,
          tabId: input.tabId,
        },
        text: allText,
      },
    },
  ]);

  let currentIndex = 0;
  const styleRequests: Array<Record<string, unknown>> = [];

  for (const paragraph of paragraphs) {
    const paragraphStart = currentIndex;
    const paragraphEnd = currentIndex + paragraph.text.length;

    if (paragraph.paragraphStyle) {
      const fields = buildFieldMask(paragraph.paragraphStyle).join(",");
      if (fields) {
        styleRequests.push({
          updateParagraphStyle: {
            fields,
            paragraphStyle: paragraph.paragraphStyle,
            range: {
              endIndex: paragraphEnd,
              segmentId: input.segmentId,
              startIndex: paragraphStart,
              tabId: input.tabId,
            },
          },
        });
      }
    }

    if (paragraph.bulletPreset) {
      styleRequests.push({
        createParagraphBullets: {
          bulletPreset: paragraph.bulletPreset,
          range: {
            endIndex: paragraphEnd,
            segmentId: input.segmentId,
            startIndex: paragraphStart,
            tabId: input.tabId,
          },
        },
      });
    }

    for (const textRun of paragraph.textRuns) {
      if (!textRun.textStyle) {
        continue;
      }
      const fields = buildFieldMask(textRun.textStyle).join(",");
      if (!fields) {
        continue;
      }
      styleRequests.push({
        updateTextStyle: {
          fields,
          range: {
            endIndex: textRun.endOffset,
            segmentId: input.segmentId,
            startIndex: textRun.startOffset,
            tabId: input.tabId,
          },
          textStyle: textRun.textStyle,
        },
      });
    }

    currentIndex = paragraphEnd;
  }

  await batchUpdateDocument(input.documentId, styleRequests);
}

async function setDocumentTabPageStyle(input: {
  documentId: string;
  tabId: string;
  style?: GoogleDocsDocumentStyle | null;
}) {
  const sourceStyle = input.style ?? {};
  const documentStyle: Record<string, unknown> = {};

  if (sourceStyle.pageSize && Object.keys(sourceStyle.pageSize).length) {
    documentStyle.pageSize = sourceStyle.pageSize;
  } else {
    documentStyle.pageSize = {
      height: { magnitude: 842, unit: "PT" },
      width: { magnitude: 595, unit: "PT" },
    };
  }

  for (const key of [
    "flipPageOrientation",
    "marginBottom",
    "marginFooter",
    "marginHeader",
    "marginLeft",
    "marginRight",
    "marginTop",
    "useEvenPageHeaderFooter",
    "useFirstPageHeaderFooter",
  ] as const) {
    const value = sourceStyle[key];
    if (value !== undefined) {
      documentStyle[key] = value;
    }
  }

  const fields = buildFieldMask(documentStyle).join(",");
  if (!fields) {
    return;
  }

  await batchUpdateDocument(input.documentId, [
    {
      updateDocumentStyle: {
        documentStyle,
        fields,
        tabId: input.tabId,
      },
    },
  ]);
}

export async function cloneDocumentTabToTarget(input: {
  sourceDocumentId: string;
  sourceTabId: string;
  targetDocumentId: string;
  targetTabId: string;
}) {
  const document = await getDocumentWithTabs(input.sourceDocumentId);
  const sourceTab = findGoogleDocTab(document, input.sourceTabId);
  if (!sourceTab) {
    throw new Error("Source Google Docs tab was not found.");
  }

  try {
    await setDocumentTabPageStyle({
      documentId: input.targetDocumentId,
      style: sourceTab.documentTab?.documentStyle ?? null,
      tabId: input.targetTabId,
    });
  } catch (error) {
    console.warn("Failed to copy page style for Google Docs tab", {
      error,
      sourceDocumentId: input.sourceDocumentId,
      sourceTabId: input.sourceTabId,
      targetDocumentId: input.targetDocumentId,
      targetTabId: input.targetTabId,
    });
  }

  const paragraphs = extractClonableParagraphs(document, sourceTab.documentTab?.body?.content);
  const allText = paragraphs.map((paragraph) => paragraph.text).join("");
  if (!allText) {
    // Continue to headers/footers even if the body is empty.
  } else {
    await batchUpdateDocument(input.targetDocumentId, [
      {
        insertText: {
          location: {
            index: 1,
            tabId: input.targetTabId,
          },
          text: allText,
        },
      },
    ]);

    let currentIndex = 1;
    const styleRequests: Array<Record<string, unknown>> = [];

    for (const paragraph of paragraphs) {
      const paragraphStart = currentIndex;
      const paragraphEnd = currentIndex + paragraph.text.length;

      if (paragraph.paragraphStyle) {
        const fields = buildFieldMask(paragraph.paragraphStyle).join(",");
        if (fields) {
          styleRequests.push({
            updateParagraphStyle: {
              fields,
              paragraphStyle: paragraph.paragraphStyle,
              range: {
                endIndex: paragraphEnd,
                startIndex: paragraphStart,
                tabId: input.targetTabId,
              },
            },
          });
        }
      }

      if (paragraph.bulletPreset) {
        styleRequests.push({
          createParagraphBullets: {
            bulletPreset: paragraph.bulletPreset,
            range: {
              endIndex: paragraphEnd,
              startIndex: paragraphStart,
              tabId: input.targetTabId,
            },
          },
        });
      }

      for (const textRun of paragraph.textRuns) {
        if (!textRun.textStyle) {
          continue;
        }
        const fields = buildFieldMask(textRun.textStyle).join(",");
        if (!fields) {
          continue;
        }
        styleRequests.push({
          updateTextStyle: {
            fields,
            range: {
              endIndex: paragraphStart + textRun.endOffset,
              startIndex: paragraphStart + textRun.startOffset,
              tabId: input.targetTabId,
            },
            textStyle: textRun.textStyle,
          },
        });
      }

      currentIndex = paragraphEnd;
    }

    await batchUpdateDocument(input.targetDocumentId, styleRequests);
  }

  const sourceDocumentStyle = sourceTab.documentTab?.documentStyle ?? {};
  const sourceDefaultHeaderId = sourceDocumentStyle.defaultHeaderId?.trim() ?? "";
  const sourceDefaultFooterId = sourceDocumentStyle.defaultFooterId?.trim() ?? "";

  if (sourceDefaultHeaderId) {
    const sourceHeader = sourceTab.documentTab?.headers?.[sourceDefaultHeaderId];
    if (sourceHeader?.content?.length) {
      try {
        const targetHeaderId = await createDefaultHeader(input.targetDocumentId, input.targetTabId);
        await cloneContentIntoSegment({
          document,
          documentId: input.targetDocumentId,
          elements: sourceHeader.content,
          segmentId: targetHeaderId,
          tabId: input.targetTabId,
        });
      } catch {
        // Ignore header cloning failures so body/template creation still succeeds.
      }
    }
  }

  if (sourceDefaultFooterId) {
    const sourceFooter = sourceTab.documentTab?.footers?.[sourceDefaultFooterId];
    if (sourceFooter?.content?.length) {
      try {
        const targetFooterId = await createDefaultFooter(input.targetDocumentId, input.targetTabId);
        await cloneContentIntoSegment({
          document,
          documentId: input.targetDocumentId,
          elements: sourceFooter.content,
          segmentId: targetFooterId,
          tabId: input.targetTabId,
        });
      } catch {
        // Ignore footer cloning failures so body/template creation still succeeds.
      }
    }
  }
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
