import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Hiretivo Open Source is offline-first: no usage ping, update check or
// announcement feed. These strings are the upstream services and the code
// that called them; if one comes back, this test says so.

const ROOT = path.resolve(import.meta.dirname, "../..");
const THIS_FILE = import.meta.filename;
const EXTENSIONS = new Set([".ts", ".tsx", ".mts"]);
const FORBIDDEN = /telemetry\.dossier\.aien\.me|api\.dossier\.aien\.me|dossier\.app@pm\.me|HIRETIVO_TELEMETRY|HIRETIVO_API_URL|HIRETIVO_UPDATES_TEST_BASE_URL|HIRETIVO_USAGE_PING_TEST_URL|@\/lib\/update-check|@\/lib\/announcements|@\/lib\/releases/;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (entry === "node_modules" || entry === "generated") return [];
    if (statSync(full).isDirectory()) return sources(full);
    return EXTENSIONS.has(path.extname(entry)) ? [full] : [];
  });
}

describe("offline by design", () => {
  it("has no path back to upstream telemetry, updates or announcements", () => {
    const matches = [...sources(path.join(ROOT, "src")), ...sources(path.join(ROOT, "e2e"))]
      .filter((file) => file !== THIS_FILE)
      .filter((file) => FORBIDDEN.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));
    expect(matches).toEqual([]);
  });
});
