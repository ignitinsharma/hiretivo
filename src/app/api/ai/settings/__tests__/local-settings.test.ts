import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

let stored: { userId: string; provider: string; model: string; endpoint: string; supportsFile: boolean; encryptedApiKey?: string | null } | null = null;
let available = true;

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  mock.module("@/auth", { namedExports: { auth: async () => ({ user: { id: "owner" } }) } });
  mock.module("@/lib/rate-limit", { namedExports: { createRateLimiter: () => ({ limit: async () => ({ success: true }) }) } });
  mock.module("@/lib/ai/local-endpoint", { namedExports: {
    normalizeLocalEndpoint: (value: string) => value,
    fetchLocalModels: async () => { if (!available) throw new Error("Offline"); return ["fixture-local-model"]; },
  } });
  mock.module("@/lib/prisma", { namedExports: { prisma: { aISettings: {
    findUnique: async () => stored,
    upsert: async ({ create, update }: { create: typeof stored; update: typeof stored }) => { stored = stored ? { ...stored, ...update } : create; return stored; },
    deleteMany: async () => { stored = null; },
  } } } });
});

after(() => { delete process.env.NEXT_PUBLIC_SELF_HOSTED; mock.restoreAll(); });

it("saves a local model without a cloud credential and leaves settings intact when the endpoint fails", async () => {
  const { PUT, GET } = await import("../route");
  const body = { provider: "LOCAL", model: "fixture-local-model", endpoint: "http://localhost:11434/v1" };
  const saved = await PUT(new Request("http://localhost/api/ai/settings", { method: "PUT", body: JSON.stringify(body) }));
  assert.equal(saved.status, 200);
  assert.equal(stored?.provider, "LOCAL");
  assert.equal(stored?.encryptedApiKey, undefined);
  assert.deepEqual((await GET().then((response) => response.json())).data, { ...body, hasKey: false, supportsFile: false });

  available = false;
  const failed = await PUT(new Request("http://localhost/api/ai/settings", { method: "PUT", body: JSON.stringify({ ...body, model: "other-model" }) }));
  assert.equal(failed.status, 502);
  assert.equal(stored?.model, "fixture-local-model");
});
