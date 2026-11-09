import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SOURCE = "src/lib/ai/resume-parser.ts";
const src = readFileSync(SOURCE, "utf8");

describe("parseResumeWithVision cascade", () => {
  it("parses text-first with the lite model", () => {
    assert.match(src, /callModelText\(text, liteModel, false, lite\.client, lite\.provider\)/);
  });
  it("skips text tier for scanned PDFs and goes straight to file tier", () => {
    assert.match(src, /No extractable text — scanned PDF/);
  });
  it("retries with the file tier when Tier 1 skills are thin", () => {
    assert.match(src, /Tier 1 thin skills → Tier 2 file/);
  });
  it("splits text and file model calls", () => {
    assert.match(src, /async function callModelText/);
    assert.match(src, /async function callModelFile/);
  });
});
