import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const publicRoot = path.join(projectRoot, "public");

const siteUrl = (process.env.SITE_URL ?? "https://acadea.org").replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  "/",
  "/jak-to-dziala",
  "/kraje",
  "/o-nas",
  "/kontakt",
  "/baza-wiedzy",
  "/stypendium",
  "/stypendium/aplikacja",
  "/umow-spotkanie",
  "/mentoruj",
  "/polityka-prywatnosci",
  "/regulamin",
];

async function readSource(relativePath) {
  return readFile(path.join(srcRoot, relativePath), "utf8");
}

function collectMatches(source, regex) {
  return Array.from(source.matchAll(regex), (match) => match[1]);
}

function dedupe(values) {
  return [...new Set(values)];
}

function toUrlEntry(route) {
  const normalizedRoute = route === "/" ? "" : route;
  const loc = `${siteUrl}${normalizedRoute}`;
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
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

  const countrySlugs = collectMatches(
    countriesSource,
    /slug:\s*"([^"]+)",\s*name:\s*"[^"]+",\s*flag:/g,
  ).map((slug) => `/kraje/${slug}`);

  const routes = dedupe([
    ...staticRoutes,
    ...countrySlugs,
    ...articleSlugs,
  ]).sort((a, b) => a.localeCompare(b));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(toUrlEntry),
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
