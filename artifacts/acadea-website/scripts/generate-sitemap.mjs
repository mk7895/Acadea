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

const staticRoutesConfig = JSON.parse(
  await readFile(path.join(srcRoot, "data", "static-routes.json"), "utf8"),
);
const staticRoutes = staticRoutesConfig
  .filter((route) => route.includeInSitemap)
  .map((route) => route.path);

const routeSourceMap = Object.fromEntries(
  staticRoutesConfig.map((route) => [route.path, route.source]),
);

async function readSource(relativePath) {
  return readFile(path.join(srcRoot, relativePath), "utf8");
}

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
  const normalizedRoute = route === "/" ? "" : route;
  const loc = `${siteUrl}${normalizedRoute}`;
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  const [articlesSource, countriesSource] = await Promise.all([
    readSource("data/articles.ts"),
    readSource("data/countries.ts"),
  ]);

  const articleSlugs = collectMatches(
    articlesSource,
    /slug:\s*"\/([^"]+)"/g,
  ).map((slug) => `/baza-wiedzy/${slug}`);
  const articleUpdatedAtBySlug = collectSlugDatePairs(
    articlesSource,
    /slug:\s*"\/([^"]+)",\s*\n\s*updatedAt:\s*"([^"]+)"/g,
  );

  const countrySlugs = collectMatches(
    countriesSource,
    /slug:\s*"([^"]+)",\s*\n\s*updatedAt:\s*"[^"]+",\s*\n\s*name:\s*"[^"]+",\s*\n\s*flag:/g,
  ).map((slug) => `/kraje/${slug}`);
  const countryUpdatedAtBySlug = collectSlugDatePairs(
    countriesSource,
    /slug:\s*"([^"]+)",\s*\n\s*updatedAt:\s*"([^"]+)"/g,
  );

  const routes = dedupe([
    ...staticRoutes,
    ...countrySlugs,
    ...articleSlugs,
  ]).sort((a, b) => a.localeCompare(b));

  const routeEntries = await Promise.all(
    routes.map(async (route) => {
      let sourceFile = routeSourceMap[route];
      if (!sourceFile && route.startsWith("/kraje/")) {
        sourceFile = "data/countries.ts";
      } else if (!sourceFile && route.startsWith("/baza-wiedzy/")) {
        sourceFile = "data/articles.ts";
      }

      const updatedAt =
        route.startsWith("/kraje/")
          ? countryUpdatedAtBySlug[route.replace("/kraje/", "")]
          : route.startsWith("/baza-wiedzy/")
            ? articleUpdatedAtBySlug[route.replace("/baza-wiedzy/", "")]
            : null;

      const lastmod =
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
