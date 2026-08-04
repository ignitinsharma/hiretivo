import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SOURCE = "src/lib/ai/resume-parser.ts";
const src = readFileSync(SOURCE, "utf8");

describe("resume parser request config", () => {
  it("caps max output tokens at 8192 for latency", () => {
    assert.match(src, /const MAX_OUTPUT_TOKENS = 8192;/);
  });
  it("caps reasoning tokens at 128", () => {
    assert.match(src, /const REASONING_CAP = 128;/);
  });
  it("uses a 90s timeout so long parses are not aborted mid-flight", () => {
    assert.match(src, /timeoutMs: 90_000/);
  });
});
