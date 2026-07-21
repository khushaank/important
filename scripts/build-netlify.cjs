#!/usr/bin/env node
/**
 * Netlify build script for Supado.
 *
 * Reads SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from environment variables
 * (set as Netlify environment variables / site secrets), validates them, then
 * assembles the _site/ directory ready for publish.
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clean(value, name) {
  let result = String(value || "").trim();
  const prefix = name + "=";
  if (result.startsWith(prefix)) result = result.slice(prefix.length).trim();
  if (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'"))
  ) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Validate secrets
// ---------------------------------------------------------------------------

const url = clean(process.env.SUPABASE_URL, "SUPABASE_URL");
const key = clean(process.env.SUPABASE_PUBLISHABLE_KEY, "SUPABASE_PUBLISHABLE_KEY");

if (!url) {
  console.error("❌  Missing SUPABASE_URL environment variable.");
  console.error("    Set it in Netlify → Site configuration → Environment variables.");
  process.exit(1);
}

let parsed;
try { parsed = new URL(url); } catch {
  console.error("❌  SUPABASE_URL is not a valid URL:", url);
  process.exit(1);
}
if (parsed.protocol !== "https:" || !parsed.hostname) {
  console.error("❌  SUPABASE_URL must be a complete HTTPS URL:", url);
  process.exit(1);
}

if (!key || key.length < 20) {
  console.error("❌  Missing or invalid SUPABASE_PUBLISHABLE_KEY environment variable.");
  console.error("    Set it in Netlify → Site configuration → Environment variables.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Assemble _site/
// ---------------------------------------------------------------------------

const ROOT  = path.resolve(__dirname, "..");
const SITE  = path.join(ROOT, "_site");

fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });

const filesToCopy = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "logo.png",
];

for (const file of filesToCopy) {
  fs.copyFileSync(path.join(ROOT, file), path.join(SITE, file));
}

// Write baked config.js
const config = { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key };
fs.writeFileSync(
  path.join(SITE, "config.js"),
  `window.APP_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});\n`
);

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

const configContents = fs.readFileSync(path.join(SITE, "config.js"), "utf8");
if (configContents.includes("YOUR_SUPABASE")) {
  console.error("❌  config.js still contains placeholder values.");
  process.exit(1);
}

console.log("✅  _site/ built successfully for Netlify.");
console.log("    Files:", fs.readdirSync(SITE).join(", "));
