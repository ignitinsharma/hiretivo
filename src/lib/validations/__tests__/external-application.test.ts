import assert from "node:assert/strict";
import { it } from "node:test";
import { PipelineStage } from "@/constants/enums";
import { externalApplicationSchema } from "@/lib/validations/external-application";

it("accepts a manual job with an optional HTTPS job URL", () => {
  const result = externalApplicationSchema.safeParse({
    title: "Software Engineer",
    companyName: "Example Co",
    pipelineStage: PipelineStage.NOT_APPLIED,
    url: "https://example.com/jobs/123",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.url, "https://example.com/jobs/123");
});

it("rejects unsafe manual job URLs", () => {
  const result = externalApplicationSchema.safeParse({
    title: "Software Engineer",
    companyName: "Example Co",
    pipelineStage: PipelineStage.NOT_APPLIED,
    url: "javascript:alert(1)",
  });
  assert.equal(result.success, false);
});

it("accepts a manual job without a URL", () => {
  const result = externalApplicationSchema.safeParse({
    title: "Designer",
    companyName: "Example Co",
    pipelineStage: PipelineStage.APPLIED,
  });
  assert.equal(result.success, true);
});
