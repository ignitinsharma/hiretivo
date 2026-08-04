import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SYSTEM_PROMPT } from "../resume-parser";

describe("resume parser system prompt", () => {
  it("requires exhaustive skill extraction", () => {
    assert.ok(SYSTEM_PROMPT.includes("Extract EVERY skill, tool, framework"));
    assert.ok(SYSTEM_PROMPT.includes("Never omit a keyword"));
  });
});
