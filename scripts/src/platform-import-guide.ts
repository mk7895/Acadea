import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type ChecklistItemBlueprint = {
  description?: string;
  externalUrl?: string;
  fileUrl?: string;
  isCompleted?: boolean;
  isRequired?: boolean;
  itemType?: "document_template" | "file_link" | "todo" | "external_link" | "reused_link";
  linkedGuideItemId?: number | null;
  sectionTitle?: string;
  sortOrder?: number;
  suggestedFilename?: string;
  title: string;
};

type GuideBlueprint = {
  country: string;
  descriptionMarkdown?: string;
  estimatedReadMin?: number;
  guideType?: "admin_template" | "mentor_blueprint";
  isVisibleToUnapprovedUsers?: boolean;
  items?: ChecklistItemBlueprint[];
  slug: string;
  status?: "draft" | "published" | "archived";
  summary?: string;
  title: string;
  universityName: string;
};

type ItemGuideBlueprint = GuideBlueprint & {
  appliesToGuideSlugs?: string[];
  key: string;
};

type MaterialRowBlueprint = {
  actionType?: "check_only" | "file_required" | "file_or_doc" | "check_or_file";
  alternativeOptions?: string[];
  appliesToGuideSlugs?: string[];
  country?: string;
  docTabPrompt?: string;
  docTabTitle?: string;
  guideKey?: string;
  level: "country" | "university" | "item";
  suggestedFilename?: string;
  task?: string;
  university?: string;
};

type MaterialTemplateBlueprint = {
  alternativeOptions?: string[];
  appliesToGuideSlugs?: string[];
  description?: string;
  guideKey?: string;
  isActive?: boolean;
  rows: MaterialRowBlueprint[];
  templateType?: "passport_like" | "essay_like";
  title: string;
};

type PlatformGuideImportBlueprint = {
  guide: GuideBlueprint;
  itemGuides?: ItemGuideBlueprint[];
  materialTemplates: MaterialTemplateBlueprint[];
  version: 1;
};

type RemoteGuide = {
  country: string;
  descriptionMarkdown: string;
  driveFolderUrl: string | null;
  guideType: string;
  id: number;
  isVisibleToUnapprovedUsers: boolean;
  items: Array<Record<string, unknown>>;
  slug: string;
  status: string;
  summary: string;
  title: string;
  universityName: string;
};

type RemoteTemplate = {
  appliesToGuideIds?: number[];
  description: string;
  guideId: number | null;
  id: number;
  isActive: boolean;
  structure?: Array<Record<string, unknown>>;
  templateType: string;
  title: string;
};

type ApiRequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PUT";
};

function resolveFilePath(input: string) {
  if (path.isAbsolute(input)) {
    return input;
  }
  return path.resolve(process.cwd(), input);
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      continue;
    }
    const [rawKey, inlineValue] = current.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue);
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(rawKey, next);
      index += 1;
      continue;
    }
    args.set(rawKey, "true");
  }
  return args;
}

function requireArg(map: Map<string, string>, key: string) {
  const fromArgs = map.get(key)?.trim();
  if (fromArgs) {
    return fromArgs;
  }
  if (key === "file") {
    throw new Error("Missing required argument: --file");
  }
  throw new Error(`Missing required argument: --${key}`);
}

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function createItemGuideMeta(appliesToGuideIds: number[]) {
  return `__meta:${JSON.stringify({
    appliesToGuideIds,
    kind: "item_guide",
  })}`;
}

function normalizeChecklistItems(items: ChecklistItemBlueprint[] | undefined) {
  return (items ?? []).map((item, index) => ({
    description: item.description ?? "",
    externalUrl: item.externalUrl ?? "",
    fileUrl: item.fileUrl ?? "",
    isCompleted: item.isCompleted ?? false,
    isRequired: item.isRequired ?? true,
    itemType: item.itemType ?? "todo",
    linkedGuideItemId: item.linkedGuideItemId ?? null,
    sectionTitle: item.sectionTitle ?? "Checklist",
    sortOrder: item.sortOrder ?? index,
    suggestedFilename: item.suggestedFilename ?? "",
    title: item.title,
  }));
}

async function apiRequest<T>(
  baseUrl: string,
  token: string,
  route: string,
  options: ApiRequestOptions = {},
) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status}) for ${route}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function loginToPlatform(baseUrl: string, email: string, password: string) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      payload.error ??
        "Could not log in automatically. On production, provide PLATFORM_API_TOKEN from localStorage if Turnstile blocks CLI login.",
    );
  }

  const payload = (await response.json()) as { token: string };
  return payload.token;
}

function resolveGuideIdsFromSlugs(
  slugs: string[] | undefined,
  guideIdBySlug: Map<string, number>,
  fallbackGuideId: number,
) {
  const ids = (slugs ?? [])
    .map((slug) => guideIdBySlug.get(slug))
    .filter((value): value is number => Number.isFinite(value));
  if (ids.length) {
    return ids;
  }
  return [fallbackGuideId];
}

async function upsertGuide(
  baseUrl: string,
  token: string,
  existingGuides: RemoteGuide[],
  payload: Record<string, unknown>,
) {
  const slug = String(payload.slug);
  const guideType = String(payload.guideType);
  const existing = existingGuides.find((guide) => guide.slug === slug && guide.guideType === guideType);

  if (existing) {
    return apiRequest<RemoteGuide>(baseUrl, token, `/admin/guides/${existing.id}`, {
      body: payload,
      method: "PUT",
    });
  }

  return apiRequest<RemoteGuide>(baseUrl, token, "/admin/guides", {
    body: payload,
    method: "POST",
  });
}

async function upsertMaterialTemplate(
  baseUrl: string,
  token: string,
  existingTemplates: RemoteTemplate[],
  payload: Record<string, unknown>,
) {
  const title = String(payload.title);
  const guideId = payload.guideId === null || payload.guideId === undefined ? null : Number(payload.guideId);
  const existing = existingTemplates.find((template) => template.title === title && template.guideId === guideId);

  if (existing) {
    return apiRequest<RemoteTemplate>(baseUrl, token, `/admin/material-templates/${existing.id}`, {
      body: payload,
      method: "PUT",
    });
  }

  return apiRequest<RemoteTemplate>(baseUrl, token, "/admin/material-templates", {
    body: payload,
    method: "POST",
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = resolveFilePath(requireArg(args, "file"));
  const raw = await fs.readFile(filePath, "utf8");
  const blueprint = JSON.parse(raw) as PlatformGuideImportBlueprint;

  if (blueprint.version !== 1) {
    throw new Error(`Unsupported blueprint version: ${String((blueprint as { version?: unknown }).version)}`);
  }

  const baseUrl = (args.get("base-url") || getEnv("PLATFORM_API_BASE_URL") || "https://api.acadea.org/api/platform").replace(/\/$/, "");
  let token = args.get("token") || getEnv("PLATFORM_API_TOKEN");

  if (!token) {
    const email = args.get("email") || getEnv("PLATFORM_ADMIN_EMAIL");
    const password = args.get("password") || getEnv("PLATFORM_ADMIN_PASSWORD");
    if (!email || !password) {
      throw new Error(
        "Missing auth. Provide PLATFORM_API_TOKEN or PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD.",
      );
    }
    token = await loginToPlatform(baseUrl, email, password);
  }

  let existingGuides = await apiRequest<RemoteGuide[]>(baseUrl, token, "/admin/guides");
  let existingTemplates = await apiRequest<RemoteTemplate[]>(baseUrl, token, "/admin/material-templates");

  const mainGuide = await upsertGuide(baseUrl, token, existingGuides, {
    country: blueprint.guide.country,
    descriptionMarkdown: blueprint.guide.descriptionMarkdown ?? "",
    driveFolderUrl: "",
    estimatedReadMin: blueprint.guide.estimatedReadMin ?? 12,
    guideType: blueprint.guide.guideType ?? "admin_template",
    isVisibleToUnapprovedUsers: blueprint.guide.isVisibleToUnapprovedUsers ?? true,
    items: normalizeChecklistItems(blueprint.guide.items),
    menteeUserId: null,
    slug: blueprint.guide.slug,
    sourceGuideId: null,
    status: blueprint.guide.status ?? "published",
    summary: blueprint.guide.summary ?? "",
    title: blueprint.guide.title,
    universityName: blueprint.guide.universityName,
  });

  existingGuides = await apiRequest<RemoteGuide[]>(baseUrl, token, "/admin/guides");

  const guideIdBySlug = new Map<string, number>([[mainGuide.slug, mainGuide.id]]);
  const itemGuideIdByKey = new Map<string, number>();

  for (const itemGuide of blueprint.itemGuides ?? []) {
    const appliesToGuideIds = resolveGuideIdsFromSlugs(
      itemGuide.appliesToGuideSlugs,
      guideIdBySlug,
      mainGuide.id,
    );
    const upserted = await upsertGuide(baseUrl, token, existingGuides, {
      country: itemGuide.country,
      descriptionMarkdown: itemGuide.descriptionMarkdown ?? "",
      driveFolderUrl: createItemGuideMeta(appliesToGuideIds),
      estimatedReadMin: itemGuide.estimatedReadMin ?? 5,
      guideType: itemGuide.guideType ?? "admin_template",
      isVisibleToUnapprovedUsers: itemGuide.isVisibleToUnapprovedUsers ?? false,
      items: normalizeChecklistItems(itemGuide.items),
      menteeUserId: null,
      slug: itemGuide.slug,
      sourceGuideId: null,
      status: itemGuide.status ?? "published",
      summary: itemGuide.summary ?? "",
      title: itemGuide.title,
      universityName: itemGuide.universityName,
    });
    guideIdBySlug.set(upserted.slug, upserted.id);
    itemGuideIdByKey.set(itemGuide.key, upserted.id);
    existingGuides = await apiRequest<RemoteGuide[]>(baseUrl, token, "/admin/guides");
  }

  for (const template of blueprint.materialTemplates) {
    const appliesToGuideIds = resolveGuideIdsFromSlugs(
      template.appliesToGuideSlugs,
      guideIdBySlug,
      mainGuide.id,
    );
    const resolvedGuideId = template.guideKey ? itemGuideIdByKey.get(template.guideKey) ?? null : null;
    const structure = template.rows.map((row) => ({
      actionType: row.actionType ?? "check_only",
      alternativeOptions: row.alternativeOptions ?? [],
      appliesToGuideIds: resolveGuideIdsFromSlugs(row.appliesToGuideSlugs, guideIdBySlug, mainGuide.id),
      country: row.country ?? "",
      docTabPrompt: row.docTabPrompt ?? "",
      docTabTitle: row.docTabTitle ?? "",
      guideId: row.guideKey ? itemGuideIdByKey.get(row.guideKey) ?? null : null,
      level: row.level,
      suggestedFilename: row.suggestedFilename ?? "",
      task: row.task ?? "",
      university: row.university ?? "",
    }));

    await upsertMaterialTemplate(baseUrl, token, existingTemplates, {
      alternativeOptions: template.alternativeOptions ?? [],
      appliesToGuideIds,
      description: template.description ?? "",
      guideId: resolvedGuideId,
      isActive: template.isActive ?? true,
      structure,
      templateType: template.templateType ?? "passport_like",
      title: template.title,
    });

    existingTemplates = await apiRequest<RemoteTemplate[]>(baseUrl, token, "/admin/material-templates");
  }

  console.log(`Imported guide "${blueprint.guide.title}" into ${baseUrl}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
