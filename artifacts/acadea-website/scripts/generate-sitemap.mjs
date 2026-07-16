import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const publicRoot = path.join(projectRoot, "public");

const siteUrl = (process.env.SITE_URL ?? "https://acadea.org").replace(/\/+$/, "");
const articleApiUrl = (
  process.env.SITEMAP_ARTICLES_API_URL ?? "https://api.acadea.org/api/articles"
).replace(/\/+$/, "");

const staticRoutesConfig = JSON.parse(
  await readFile(path.join(srcRoot, "data", "static-routes.json"), "utf8"),
);
const staticRoutes = staticRoutesConfig
  .filter((route) => route.includeInSitemap)
  .map((route) => route.path);

const routeSourceMap = Object.fromEntries(
  staticRoutesConfig.map((route) => [route.path, route.source]),
);

function collectMatches(source, regex) {
  return Array.from(source.matchAll(regex), (match) => match[1]);
}

function collectSlugDatePairs(source, regex) {
  return Object.fromEntries(
    Array.from(source.matchAll(regex), (match) => [match[1], match[2]]),
  );
}

function dedupe(values) {
  return [...new Set(values)];
}

async function getGitLastModified(relativePath) {
  try {
    const filePath = path.join(projectRoot, relativePath);
    const { stdout } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%cs", "--", filePath],
      { cwd: projectRoot },
    );
    const value = stdout.trim();
    return value || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function toUrlEntry(route, lastmod) {
  const normalizedRoute = route === "/" ? "" : `${route.replace(/\/+$/, "")}/`;
  const loc = `${siteUrl}${normalizedRoute}`;
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "  </url>",
  ].join("\n");
}

async function getPublishedArticleRoutes() {
  try {
    const responses = await Promise.all(
      ["pl", "en"].map(async (language) => {
        const response = await fetch(`${articleApiUrl}?language=${language}`);
        if (!response.ok) {
          throw new Error(`Article API responded with ${response.status} for ${language}`);
        }

        return response.json();
      }),
    );

    return responses.flatMap((articles, index) => {
      const language = index === 0 ? "pl" : "en";
      return articles
        .filter((article) => article?.isPublished && typeof article.slug === "string")
        .map((article) => ({
          path: language === "en" ? `/en/knowledge-base${article.slug}` : `/baza-wiedzy${article.slug}`,
          lastmod: article.updatedAt || new Date().toISOString().slice(0, 10),
        }));
    });
  } catch (error) {
    // The static sitemap must never advertise the stale development article fixture.
    // Articles remain discoverable through internal links and the live API sitemap.
    console.warn(`Skipping live article URLs in sitemap: ${error.message}`);
    return [];
  }
}

async function main() {
  const countriesSource = await readFile(path.join(srcRoot, "data", "countries.ts"), "utf8");
  const liveArticleRoutes = await getPublishedArticleRoutes();

  const countrySlugs = collectMatches(
    countriesSource,
    /slug:\s*"([^"]+)",\s*\n\s*updatedAt:\s*"[^"]+",\s*\n\s*name:\s*"[^"]+",\s*\n\s*flag:/g,
  ).map((slug) => `/kraje/${slug}`);
  const countryUpdatedAtBySlug = collectSlugDatePairs(
    countriesSource,
    /slug:\s*"([^"]+)",\s*\n\s*updatedAt:\s*"([^"]+)"/g,
  );

  const staticAndCountryRoutes = dedupe([...staticRoutes, ...countrySlugs]);
  const articleLastmodByPath = new Map(liveArticleRoutes.map((route) => [route.path, route.lastmod]));
  const routes = dedupe([...staticAndCountryRoutes, ...liveArticleRoutes.map((route) => route.path)]).sort((a, b) =>
    a.localeCompare(b),
  );

  const routeEntries = await Promise.all(
    routes.map(async (route) => {
      let sourceFile = routeSourceMap[route];
      if (!sourceFile && route.startsWith("/kraje/")) {
        sourceFile = "data/countries.ts";
      }

      const updatedAt =
        route.startsWith("/kraje/")
          ? countryUpdatedAtBySlug[route.replace("/kraje/", "")]
          : null;

      const lastmod =
        articleLastmodByPath.get(route) ??
        updatedAt ??
        (await getGitLastModified(sourceFile ? `src/${sourceFile}` : "index.html"));

      return toUrlEntry(route, lastmod);
    }),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routeEntries,
    "</urlset>",
    "",
  ].join("\n");

  await writeFile(path.join(publicRoot, "sitemap.xml"), xml, "utf8");
  console.log(`Generated sitemap with ${routes.length} URLs`);
}

main().catch((error) => {
  console.error("Failed to generate sitemap");
  console.error(error);
  process.exit(1);
});
