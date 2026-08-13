import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const promptSrc = readFileSync("src/lib/ai-prompts.ts", "utf8");
const tailorSrc = readFileSync("src/lib/ai/resume-tailor.ts", "utf8");
const coverLetterSrc = readFileSync("src/lib/ai/cover-letter-generator.ts", "utf8");
const rewriteSrc = readFileSync("src/app/api/applications/[id]/rewrite/route.ts", "utf8");

describe("resume-tailor truncation handling", () => {
  it("allows enough output tokens for a full tailored resume", () => {
    assert.match(promptSrc, /max_tokens: 8192/);
  });
  it("retries once with a larger budget when output truncates", () => {
    assert.match(tailorSrc, /finishReason === "length"/);
    assert.match(tailorSrc, /callTailor\(16384\)/);
  });
  it("keeps the worker's AI attempt budget below Vercel's 60s limit", () => {
    assert.match(tailorSrc, /timeoutMs: 45_000, maxRetries: 0/);
    assert.match(coverLetterSrc, /timeoutMs: 25_000, maxRetries: 1/);
    assert.match(rewriteSrc, /timeoutMs: 25_000, maxRetries: 1/);
  });
});
