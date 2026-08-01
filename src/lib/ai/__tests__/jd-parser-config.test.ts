import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SOURCE = "src/lib/ai/jd-parser.ts";
const src = readFileSync(SOURCE, "utf8");

describe("jd-parser config", () => {
  it("caps max_tokens at 4000", () => {
    assert.match(src, /max_tokens: 4000/);
  });
  it("requires exhaustive skill extraction", () => {
    assert.match(src, /EVERY skill, technology, tool, and keyword mentioned/);
  });
});
