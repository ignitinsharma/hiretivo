import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";
import { AIProvider } from "@prisma/client";

let provider: typeof AIProvider.OPENAI | typeof AIProvider.ANTHROPIC | typeof AIProvider.GOOGLE = AIProvider.OPENAI;

before(() => {
  process.env.NEXT_PUBLIC_SELF_HOSTED = "true";
  mock.module("@/lib/prisma", { namedExports: { prisma: { aISettings: { findUnique: async () => ({ provider, model: "selected-model", encryptedApiKey: "encrypted" }) } } } });
  mock.module("@/lib/ai/provider-secret", { namedExports: { decryptProviderSecret: () => "private-key" } });
});

after(() => { delete process.env.NEXT_PUBLIC_SELF_HOSTED; mock.restoreAll(); });

it("routes each account's direct provider key to its own API", async () => {
  const { getUserAIContext } = await import("@/lib/openrouter");
  for (const [selected, baseURL] of [
    [AIProvider.OPENAI, "https://api.openai.com/v1"],
    [AIProvider.ANTHROPIC, "https://api.anthropic.com/v1"],
    [AIProvider.GOOGLE, "https://generativelanguage.googleapis.com/v1beta/openai"],
  ] as const) {
    provider = selected;
    const context = await getUserAIContext("owner", "parse");
    assert.equal(context.provider, selected);
    assert.equal(context.model, "selected-model");
    assert.equal(context.client.baseURL, baseURL);
    assert.equal(context.supportsFile, false);
  }
});
