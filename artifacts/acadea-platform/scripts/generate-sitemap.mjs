import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const publicRoot = path.join(projectRoot, "public");

const siteUrl = (process.env.SITE_URL ?? "https://app.acadea.org").replace(/\/+$/, "");

const staticRoutesConfig = JSON.parse(
  await readFile(path.join(srcRoot, "data", "static-routes.json"), "utf8"),
);

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
  const routes = staticRoutesConfig
    .filter((route) => route.includeInSitemap)
    .map((route) => toUrlEntry(route.path, route.lastmod ?? new Date().toISOString().slice(0, 10)));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes,
    "</urlset>",
    "",
  ].join("\n");

  await writeFile(path.join(publicRoot, "sitemap.xml"), xml, "utf8");
  console.log(`Generated platform sitemap with ${routes.length} URLs`);
}

main().catch((error) => {
  console.error("Failed to generate platform sitemap");
  console.error(error);
  process.exit(1);
});
