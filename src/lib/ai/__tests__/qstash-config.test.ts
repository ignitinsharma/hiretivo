import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const QSTASH = "src/lib/generation/qstash.ts";
const GENERATE = "src/app/api/applications/[id]/generate/route.ts";

const qstashSrc = readFileSync(QSTASH, "utf8");
const generateSrc = readFileSync(GENERATE, "utf8");

describe("QStash enqueue config", () => {
  it("uses a deduplicationId without a colon (QStash rejects ':')", () => {
    assert.doesNotMatch(qstashSrc, /application-generation:/);
    assert.match(qstashSrc, /application-generation-\$\{message\.runId\}/);
  });

  it("delivers to the enqueuing deployment's own worker origin", () => {
    assert.match(generateSrc, /new URL\("\/api\/internal\/generation-worker", request\.url\)/);
  });
});
