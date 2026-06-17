// Generates dist/sitemap.xml from the list of public routes.
// Run after `vite build` so it lands inside the deployable artifact.

import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// Minimal .env loader so VITE_SITE_URL (and friends) match what Vite reads.
function loadDotenv(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotenv(path.join(ROOT, ".env"));
loadDotenv(path.join(ROOT, ".env.local"));

const SITE_URL = (process.env.VITE_SITE_URL || "https://lendsmart.me").replace(
  /\/$/,
  "",
);

// Keep this list in sync with PUBLIC_ROUTE_PATHS in src/lib/seo.ts.
const ROUTES = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/features", priority: 0.9, changefreq: "monthly" },
  { path: "/pricing", priority: 0.9, changefreq: "monthly" },
  { path: "/terms", priority: 0.3, changefreq: "yearly" },
  { path: "/privacy", priority: 0.3, changefreq: "yearly" },
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
).join("\n")}
</urlset>
`;

await fs.mkdir(DIST, { recursive: true });
const outFile = path.join(DIST, "sitemap.xml");
await fs.writeFile(outFile, xml, "utf8");

console.log(
  `[sitemap] wrote ${path.relative(ROOT, outFile)} with ${ROUTES.length} urls (site: ${SITE_URL})`,
);
