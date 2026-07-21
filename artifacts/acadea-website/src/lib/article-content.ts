export const ARTICLE_CONTACT_FORM_MARKER = "***CONTACT FORM BLOCK***";
export const ARTICLE_WHATSAPP_GROUP_MARKER = "***WHATSAPP GROUP BLOCK***";

export type ArticleTocItem = {
  sourceIndex: number;
  sourceText: string;
  anchorId: string;
  label: string;
  include: boolean;
  level: number;
};

export type ArticleCategoryGroup = {
  id: number;
  name: string;
  nameEn?: string | null;
  slug: string;
  sortOrder: number;
  categories: ArticleCategory[];
};

export type ArticleCategory = {
  id: number;
  groupId: number;
  name: string;
  nameEn?: string | null;
  slug: string;
  sortOrder: number;
};

export function normalizeArticleSlug(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }

  const withoutSpaces = trimmed.replace(/\s+/g, "-");
  return withoutSpaces.startsWith("/") ? withoutSpaces : `/${withoutSpaces}`;
}

export function estimateReadMinutes(markdown: string) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\(([^)]+)\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText ? plainText.split(" ").length : 0;
  return Math.max(3, Math.ceil(words / 180));
}

export function normalizeCategorySlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeContactFormMarkers(markdown: string) {
  return markdown
    .replace(/\*{3}\s*CONTACT FORM BLOCK\s*\*{3}/gi, ARTICLE_CONTACT_FORM_MARKER)
    .replace(/\*{3}\s*WHATSAPP GROUP BLOCK\s*\*{3}/gi, ARTICLE_WHATSAPP_GROUP_MARKER);
}

export function stripLeadingTitleHeading(markdown: string) {
  return markdown.replace(/^#\s+.+?\n+/, "").trim();
}

export function extractMarkdownHeadings(markdown: string): ArticleTocItem[] {
  const body = stripLeadingTitleHeading(markdown);
  const matches = Array.from(body.matchAll(/^(##|###|####)\s+(.+)$/gm));

  return matches.map((match, index) => {
    const hashes = match[1] ?? "##";
    const sourceText = (match[2] ?? "").trim();
    const anchorId = normalizeCategorySlug(sourceText) || `sekcja-${index + 1}`;

    return {
      sourceIndex: index,
      sourceText,
      anchorId,
      label: sourceText,
      include: true,
      level: hashes.length,
    };
  });
}

export function normalizeTocItems(markdown: string, currentItems: ArticleTocItem[]) {
  const extracted = extractMarkdownHeadings(markdown);
  const currentByIndex = new Map(currentItems.map((item) => [item.sourceIndex, item]));

  return extracted.map((item) => {
    const existing = currentByIndex.get(item.sourceIndex);
    return {
      ...item,
      anchorId: normalizeCategorySlug(existing?.anchorId || item.anchorId) || item.anchorId,
      label: existing?.label?.trim() || item.label,
      include: existing?.include ?? true,
    };
  });
}

export function splitRelatedSection(markdown: string) {
  const marker = /\n## (?:Czytaj też|Read also|Read more|Related reading)\s*\n/i;
  const match = marker.exec(markdown);
  if (!match) {
    return {
      body: markdown.trim(),
      relatedSlugs: [] as string[],
    };
  }

  const body = markdown.slice(0, match.index).trim();
  const relatedSection = markdown.slice(match.index + match[0].length);
  const relatedSlugs = Array.from(
    relatedSection.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g),
    (entry) => normalizeArticleSlug(entry[1] ?? ""),
  ).filter(Boolean);

  return {
    body,
    relatedSlugs: Array.from(new Set(relatedSlugs)),
  };
}
