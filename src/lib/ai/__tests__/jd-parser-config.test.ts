import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SOURCE = "src/lib/ai/jd-parser.ts";
const src = readFileSync(SOURCE, "utf8");

describe("jd-parser config", () => {
  it("keeps a generous max_tokens budget for full JD output", () => {
    assert.match(src, /max_tokens: 16000/);
  });
  it("extracts skills mentioned in the description", () => {
    assert.match(src, /"skills": an array of skill strings mentioned in the description/);
  });
});
