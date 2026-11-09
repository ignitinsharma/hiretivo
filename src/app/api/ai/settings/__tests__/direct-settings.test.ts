import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

type Saved = { userId: string; provider: string; model: string; encryptedApiKey: string; supportsFile: boolean };
let stored: Saved | null = null;
let rejectKey = false;
const originalFetch = globalThis.fetch;

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  process.env.HIRETIVO_ENCRYPTION_KEY = "ab".repeat(32);
  mock.module("@/auth", { namedExports: { auth: async () => ({ user: { id: "owner" } }) } });
  mock.module("@/lib/rate-limit", { namedExports: { createRateLimiter: () => ({ limit: async () => ({ success: true }) }) } });
  mock.module("@/lib/prisma", { namedExports: { prisma: { aISettings: {
    findUnique: async () => stored,
    upsert: async ({ create, update }: { create: Saved; update: Saved }) => { stored = stored ? { ...stored, ...update } : create; return stored; },
    deleteMany: async () => { stored = null; },
  } } } });
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (rejectKey) return new Response(null, { status: 401 });
    const url = String(input);
    const model = url.includes("api.openai.com") ? "gpt-6-mini" : url.includes("api.anthropic.com") ? "claude-sonnet-5" : "gemini-3.6-flash";
    return Response.json({ data: [{ id: model }] });
  }) as typeof fetch;
});

after(() => { globalThis.fetch = originalFetch; delete process.env.NEXT_PUBLIC_SELF_HOSTED; delete process.env.HIRETIVO_ENCRYPTION_KEY; mock.restoreAll(); });

it("encrypts direct keys per provider and preserves the last valid settings on rejected credentials", async () => {
  const { PUT, GET } = await import("../route");
  for (const [provider, model] of [["OPENAI", "gpt-6-mini"], ["ANTHROPIC", "claude-sonnet-5"], ["GOOGLE", "gemini-3.6-flash"]]) {
    const saved = await PUT(new Request("http://localhost/api/ai/settings", { method: "PUT", body: JSON.stringify({ provider, model, apiKey: `secret-${provider}` }) }));
    assert.equal(saved.status, 200);
    assert.equal(stored?.provider, provider);
    assert.ok(stored?.encryptedApiKey.startsWith("v1."));
    assert.ok(!stored?.encryptedApiKey.includes(`secret-${provider}`));
    const publicSettings = await GET().then((response) => response.json());
    assert.equal(publicSettings.data.provider, provider);
    assert.equal(publicSettings.data.hasKey, true);
    assert.ok(!JSON.stringify(publicSettings).includes(`secret-${provider}`));
  }
  rejectKey = true;
  const failed = await PUT(new Request("http://localhost/api/ai/settings", { method: "PUT", body: JSON.stringify({ provider: "OPENAI", model: "gpt-6-mini", apiKey: "invalid-key" }) }));
  assert.equal(failed.status, 422);
  assert.equal(stored?.provider, "GOOGLE");
});
