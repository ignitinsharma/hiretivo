import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const QSTASH = "src/lib/generation/qstash.ts";
const DISPATCH = "src/lib/generation/dispatch-generation.ts";
const GENERATE = "src/app/api/applications/[id]/generate/route.ts";

const qstashSrc = readFileSync(QSTASH, "utf8");
const dispatchSrc = readFileSync(DISPATCH, "utf8");
const generateSrc = readFileSync(GENERATE, "utf8");

describe("QStash enqueue config", () => {
  it("uses a deduplicationId without a colon (QStash rejects ':')", () => {
    assert.doesNotMatch(qstashSrc, /application-generation:/);
    assert.match(qstashSrc, /application-generation-\$\{message\.runId\}/);
  });

  it("delivers to the enqueuing deployment's own worker origin (production)", () => {
    assert.match(dispatchSrc, /new URL\(GENERATION_WORKER_PATH, requestUrl\)/);
    assert.match(dispatchSrc, /process\.env\.NODE_ENV === "production"/);
    assert.match(dispatchSrc, /publishGenerationJob\(message, workerUrl\)/);
  });

  it("runs the worker function inline outside production (QStash cannot reach localhost)", () => {
    assert.match(dispatchSrc, /runApplicationGeneration\(message\)/);
  });

  it("routes the generate endpoint through the dispatcher", () => {
    assert.match(generateSrc, /dispatchGenerationJob\(/);
    assert.doesNotMatch(generateSrc, /publishGenerationJob/);
  });
});