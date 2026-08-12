import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withRetry } from "@/lib/ai/with-retry";

describe("withRetry", () => {
  it("passes an AbortSignal to the operation", async () => {
    const result = await withRetry(
      async (signal?: AbortSignal) => (signal ? "signal-received" : "signal-missing"),
      { maxRetries: 0, timeoutMs: 10 },
    );

    assert.equal(result, "signal-received");
  });
});
