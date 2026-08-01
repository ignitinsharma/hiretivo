import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTailorResumeMessages } from "../../ai-prompts";

describe("buildTailorResumeMessages", () => {
  const msgs = buildTailorResumeMessages({
    resumeJson: "{}",
    jdText: "We need a React engineer.",
    jobSkills: ["React"],
    jobTitle: "Frontend Engineer",
  });

  it("requires surfacing every JD-relevant skill present in the source", () => {
    assert.ok(msgs.system.includes("EVERY skill present in the input resume JSON"));
  });
  it("still forbids fabricating skills not in the source", () => {
    assert.ok(msgs.system.includes("never infer or invent skills"));
  });
});
