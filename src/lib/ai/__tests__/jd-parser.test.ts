import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SOURCE = "src/lib/ai/jd-parser.ts";
const src = readFileSync(SOURCE, "utf8");

describe("jd-parser: JS-rendered SPA safety net", () => {
  it("strips <noscript> so the 'enable JavaScript' fallback never reaches the LLM", () => {
    assert.match(src, /"noscript"/);
  });

  it("rejects near-empty extracted text (JS app shells) before the LLM call", () => {
    assert.match(src, /MIN_MEANINGFUL_CHARS/);
    assert.match(src, /js-app-shell or too short/);
  });

  it("caps the JD-parse LLM call at 20s (Vercel Hobby safety)", () => {
    assert.match(src, /\}, \{ timeoutMs: 20_000 \}\);/);
  });
});

describe("jd-parser: Ashby API path (bypasses the SPA scrape)", () => {
  it("detects jobs.ashbyhq.com/{boardToken}/{jobId} URLs", () => {
    assert.match(src, /jobs\.ashbyhq\.com/);
    assert.match(src, /isAshbyUrl/);
  });

  it("calls Ashby's public board posting API, not the auth-gated single-job endpoint", () => {
    assert.match(src, /api\.ashbyhq\.com\/posting-api\/job-board\//);
  });

  it("matches the requested job by id from the board response", () => {
    assert.match(src, /j\.id === jobId/);
  });

  it("prefers descriptionPlain (clean text) over stripping descriptionHtml", () => {
    assert.match(src, /descriptionPlain/);
  });

  it("derives a company name from the board token", () => {
    assert.match(src, /deriveCompanyNameFromBoardToken/);
  });

  it("routes Ashby URLs to the API path inside parseJobFromUrl", () => {
    assert.match(src, /if \(isAshbyUrl\(url\)\)[\s\S]*?return parseAshbyJobFromUrl\(url\)/);
  });
});
