export const ARTICLE_CONTACT_FORM_MARKER = "***CONTACT FORM BLOCK***";
export const ARTICLE_WHATSAPP_GROUP_MARKER = "***WHATSAPP GROUP BLOCK***";

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
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function normalizeContactFormMarkers(markdown: string) {
  return markdown
    .replace(
      /\*\*\*\s*CONTACT FORM BLOCK\s*\*\*\*/gi,
      ARTICLE_CONTACT_FORM_MARKER,
    )
    .replace(
      /\*\*\*\s*WHATSAPP GROUP BLOCK\s*\*\*\*/gi,
      ARTICLE_WHATSAPP_GROUP_MARKER,
    );
}

export function stripLeadingTitleHeading(markdown: string) {
  return markdown.replace(/^# .+\n+/, "").trim();
}

export function extractMarkdownHeadings(markdown: string) {
  const body = stripLeadingTitleHeading(normalizeContactFormMarkers(markdown));
  const matches = Array.from(body.matchAll(/^(#{2,4})\s+(.+)$/gm));

  return matches.map((match, index) => ({
    sourceIndex: index,
    sourceText: String(match[2] ?? "").trim(),
    anchorId:
      normalizeCategorySlug(
        String(match[2] ?? "")
          .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
          .replace(/[*_`~]/g, ""),
      ) || `sekcja-${index + 1}`,
    label: String(match[2] ?? "").trim(),
    include: true,
    level: String(match[1] ?? "##").length,
  }));
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
