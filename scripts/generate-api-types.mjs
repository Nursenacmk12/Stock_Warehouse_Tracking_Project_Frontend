#!/usr/bin/env node
/**
 * Generate TypeScript types from the StockGuard OpenAPI document.
 *
 * Source resolution (first match wins):
 *   1. OPENAPI_URL  — remote swagger JSON (e.g. http://localhost:5087/swagger/v1/swagger.json)
 *   2. OPENAPI_FILE — local path override
 *   3. openapi/swagger.json — committed snapshot (offline / CI)
 *   4. http://localhost:5087/swagger/v1/swagger.json — live API default
 *
 * Usage:
 *   npm run generate:api-types
 *   OPENAPI_URL=https://staging.example/swagger/v1/swagger.json npm run generate:api-types
 *   npm run generate:api-types:refresh   # fetch live + update snapshot + types
 */
import { spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outFile = join(root, "src", "types", "generated-api.d.ts");
const snapshotFile = join(root, "openapi", "swagger.json");
const defaultUrl = "http://localhost:5087/swagger/v1/swagger.json";
const refreshSnapshot = process.argv.includes("--refresh-snapshot");

function pickSource() {
  if (process.env.OPENAPI_URL?.trim()) {
    return { kind: "url", value: process.env.OPENAPI_URL.trim() };
  }
  if (process.env.OPENAPI_FILE?.trim()) {
    return { kind: "file", value: resolve(process.env.OPENAPI_FILE.trim()) };
  }
  if (!refreshSnapshot && existsSync(snapshotFile)) {
    return { kind: "file", value: snapshotFile };
  }
  return { kind: "url", value: defaultUrl };
}

async function downloadToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenAPI from ${url}: HTTP ${res.status}`);
  }
  mkdirSync(dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function main() {
  let source = pickSource();
  let inputPath = source.value;

  if (source.kind === "url") {
    const dest = refreshSnapshot || !existsSync(snapshotFile) ? snapshotFile : join(root, "openapi", ".swagger.cache.json");
    console.log(`Fetching OpenAPI: ${source.value}`);
    try {
      await downloadToFile(source.value, dest);
      inputPath = dest;
      if (refreshSnapshot || dest === snapshotFile) {
        console.log(`Snapshot updated: ${snapshotFile}`);
      }
    } catch (err) {
      if (existsSync(snapshotFile)) {
        console.warn(`Live fetch failed (${err.message}); falling back to ${snapshotFile}`);
        inputPath = snapshotFile;
      } else {
        throw err;
      }
    }
  } else {
    if (!existsSync(inputPath)) {
      throw new Error(`OpenAPI file not found: ${inputPath}`);
    }
    console.log(`Using OpenAPI file: ${inputPath}`);
  }

  mkdirSync(dirname(outFile), { recursive: true });
  const cliJs = join(root, "node_modules", "openapi-typescript", "bin", "cli.js");
  if (!existsSync(cliJs)) {
    throw new Error("openapi-typescript is not installed. Run: npm install");
  }
  const result = spawnSync(process.execPath, [cliJs, inputPath, "-o", outFile], {
    cwd: root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
