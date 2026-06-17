// Prerenders public marketing routes into static HTML files in dist/ so
// crawlers receive the fully-rendered page on first request.
//
// Strategy:
//   1. Spin up a tiny static server pointing at dist/.
//   2. Use the Playwright Chromium that ships with the `playwright` package
//      (already a project dependency) to navigate to each public route.
//   3. Wait for the React tree to mount, capture the document HTML, and
//      write it to disk at dist/<route>/index.html.
//
// The SPA still hydrates on top of the prerendered markup, so behaviour for
// real users is unchanged. Visitors and crawlers just get meaningful HTML on
// the very first byte.

import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// Keep in sync with PUBLIC_ROUTE_PATHS in src/lib/seo.ts.
const ROUTES = ["/", "/features", "/pricing", "/terms", "/privacy"];
const PORT = Number(process.env.PRERENDER_PORT || 4179);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
        let filePath = path.join(DIST, decodeURIComponent(requestUrl.pathname));

        try {
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            filePath = path.join(filePath, "index.html");
          }
        } catch {
          // Fallback to SPA shell so client-side routing can take over.
          filePath = path.join(DIST, "index.html");
        }

        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "no-store",
        });
        res.end(data);
      } catch (error) {
        res.writeHead(500);
        res.end(String(error));
      }
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

async function prerender() {
  if (!existsSync(DIST)) {
    console.error(
      "[prerender] dist/ does not exist. Run `vite build` before this script.",
    );
    process.exit(1);
  }

  // Lazy import so a missing optional dep does not crash the rest of the
  // build pipeline before we have a chance to log a friendly error.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    console.error(
      "[prerender] playwright is not installed or browsers are missing.",
    );
    console.error(
      "[prerender] run `npm install` and then `npx playwright install chromium`.",
    );
    console.error(error);
    process.exit(1);
  }

  console.log(`[prerender] starting static server on port ${PORT}`);
  const server = await startStaticServer();

  let browser;
  try {
    console.log("[prerender] launching chromium");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
      userAgent:
        "Mozilla/5.0 (compatible; LendSmartPrerender/1.0; +https://www.lendsmart.me)",
    });

    for (const route of ROUTES) {
      console.log(`[prerender] capturing ${route}`);
      const page = await context.newPage();
      const url = `http://127.0.0.1:${PORT}${route}`;

      // Use `domcontentloaded` rather than `networkidle` because the SPA
      // may keep connections open (auth, realtime) that prevent idle.
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      if (!response || !response.ok()) {
        throw new Error(
          `Failed to load ${url}: status ${response ? response.status() : "no response"}`,
        );
      }

      // Wait for the React tree to mount and produce real content.
      await page.waitForSelector("#main-content", { timeout: 15000 });
      // Give async work (idle React effects, JSON-LD insertion) a beat to settle.
      await page.waitForTimeout(500);

      const html = await page.content();

      const outDir =
        route === "/" ? DIST : path.join(DIST, route.replace(/^\//, ""));
      await fs.mkdir(outDir, { recursive: true });
      const outFile = path.join(outDir, "index.html");
      await fs.writeFile(outFile, html, "utf8");
      console.log(`[prerender] wrote ${path.relative(ROOT, outFile)}`);

      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log("[prerender] done");
}

prerender().catch((error) => {
  console.error("[prerender] failed:", error);
  process.exit(1);
});
