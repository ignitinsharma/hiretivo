import { describe, expect, it } from "vitest";

import { toAiError } from "./errors";

describe("AI rate limit metadata", () => {
  it("retains a provider's retry-after without exposing its message", () => {
    const error = toAiError({ status: 429, name: "RateLimitError", message: "private request text", headers: new Headers({ "retry-after": "45" }) }, { model: "example" });
    expect(error).toMatchObject({ kind: "rate-limited", retryAfterMs: 45_000 });
    expect(error.message).not.toContain("private request text");
  });
});
