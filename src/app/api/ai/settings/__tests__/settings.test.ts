import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

let stored: { userId: string; provider: string; model: string; encryptedApiKey: string; supportsFile: boolean } | null = null;

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  process.env.HIRETIVO_ENCRYPTION_KEY = "ab".repeat(32);
  mock.module("@/auth", { namedExports: { auth: async () => ({ user: { id: "owner" } }) } });
  mock.module("@/lib/rate-limit", { namedExports: { createRateLimiter: () => ({ limit: async () => ({ success: true }) }) } });
  mock.module("@/lib/ai/openrouter-models", { namedExports: { fetchOpenRouterModels: async () => [{ id: "fixture/model", name: "Fixture", isFree: true, supportsFile: false, contextLength: 8192 }] } });
  mock.module("@/lib/prisma", { namedExports: { prisma: { aISettings: {
    findUnique: async () => stored,
    upsert: async ({ create }: { create: typeof stored }) => { stored = create; return stored; },
    deleteMany: async () => { stored = null; },
  } } } });
});

after(() => {
  delete process.env.NEXT_PUBLIC_SELF_HOSTED;
  delete process.env.HIRETIVO_ENCRYPTION_KEY;
  mock.restoreAll();
});

it("stores an encrypted key and excludes it from saved settings responses", async () => {
  const { PUT, GET, DELETE } = await import("../route");
  const saved = await PUT(new Request("http://localhost/api/ai/settings", {
    method: "PUT", body: JSON.stringify({ provider: "OPENROUTER", model: "fixture/model", apiKey: "sk-sensitive-test-key" }),
  }));
  assert.equal(saved.status, 200);
  assert.ok(stored?.encryptedApiKey.startsWith("v1."));
  assert.ok(!stored?.encryptedApiKey.includes("sk-sensitive-test-key"));
  const publicResponse = await GET();
  assert.equal(publicResponse.status, 200);
  assert.equal((await publicResponse.json()).data.hasKey, true);
  assert.ok(!JSON.stringify(await saved.json()).includes("sk-sensitive-test-key"));
  assert.ok(!JSON.stringify(await GET().then((response) => response.json())).includes(stored?.encryptedApiKey ?? "sk-sensitive-test-key"));
  assert.equal((await DELETE()).status, 200);
  assert.equal((await GET().then((response) => response.json())).data, null);
});
