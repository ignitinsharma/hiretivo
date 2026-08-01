import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const promptSrc = readFileSync("src/lib/ai-prompts.ts", "utf8");
const tailorSrc = readFileSync("src/lib/ai/resume-tailor.ts", "utf8");

describe("resume-tailor truncation handling", () => {
  it("allows enough output tokens for a full tailored resume", () => {
    assert.match(promptSrc, /max_tokens: 8192/);
  });
  it("retries once with a larger budget when output truncates", () => {
    assert.match(tailorSrc, /finishReason === "length"/);
    assert.match(tailorSrc, /callTailor\(16384\)/);
  });
});
