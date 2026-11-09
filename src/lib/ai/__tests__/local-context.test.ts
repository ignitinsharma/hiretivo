import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  mock.module("@/lib/prisma", { namedExports: { prisma: { aISettings: { findUnique: async () => ({ provider: "LOCAL", model: "fixture-local-model", endpoint: "http://localhost:11434/v1" }) } } } });
});

after(() => { delete process.env.NEXT_PUBLIC_SELF_HOSTED; mock.restoreAll(); });

it("routes resume parsing through the account's local model without a cloud key", async () => {
  const { getUserAIContext } = await import("@/lib/openrouter");
  const context = await getUserAIContext("owner", "parse");
  assert.equal(context.model, "fixture-local-model");
  assert.equal(context.client.baseURL, "http://localhost:11434/v1");
  assert.equal(context.supportsFile, false);
});
