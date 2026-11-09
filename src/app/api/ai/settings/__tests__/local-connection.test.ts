import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

const originalFetch = globalThis.fetch;
let reachable = true;

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  mock.module("@/auth", { namedExports: { auth: async () => ({ user: { id: "owner" } }) } });
  mock.module("@/lib/rate-limit", { namedExports: { createRateLimiter: () => ({ limit: async () => ({ success: true }) }) } });
  mock.module("@/lib/prisma", { namedExports: { prisma: { aISettings: { findUnique: async () => null } } } });
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    assert.equal(String(input), "http://localhost:11434/v1/chat/completions");
    if (!reachable) throw new Error("Connection refused");
    return Response.json({ choices: [{ message: { content: "OK" } }] });
  }) as typeof fetch;
});

after(() => { globalThis.fetch = originalFetch; delete process.env.NEXT_PUBLIC_SELF_HOSTED; mock.restoreAll(); });

it("tests a local model and reports an unreachable server", async () => {
  const { POST } = await import("../test/route");
  const request = () => new Request("http://localhost/api/ai/settings/test", { method: "POST", body: JSON.stringify({ provider: "LOCAL", model: "fixture-local-model", endpoint: "http://localhost:11434/v1" }) });
  assert.equal((await POST(request())).status, 200);
  reachable = false;
  const failed = await POST(request());
  assert.equal(failed.status, 502);
  assert.match((await failed.json()).error, /unreachable/);
});
