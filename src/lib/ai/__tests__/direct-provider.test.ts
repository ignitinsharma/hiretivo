import assert from "node:assert/strict";
import { after, it } from "node:test";
import { AIProvider } from "@prisma/client";
import { completionTokenLimit, directProviderBaseUrl, fetchDirectModels } from "../direct-provider";

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

it("uses each provider's direct API and lists text-capable models", async () => {
  const cases = [
    [AIProvider.OPENAI, "https://api.openai.com/v1/models", "gpt-6-mini", "gpt-image-1"],
    [AIProvider.ANTHROPIC, "https://api.anthropic.com/v1/models", "claude-sonnet-5", "unrelated-model"],
    [AIProvider.GOOGLE, "https://generativelanguage.googleapis.com/v1beta/openai/models", "gemini-3.6-flash", "gemini-embedding-2"],
  ] as const;
  for (const [provider, expectedUrl, textModel, excludedModel] of cases) {
    globalThis.fetch = (async (input: RequestInfo | URL, options?: RequestInit) => {
      assert.equal(String(input), expectedUrl);
      assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer private-key");
      return Response.json({ data: [{ id: textModel }, { id: excludedModel }] });
    }) as typeof fetch;
    assert.equal(`${directProviderBaseUrl(provider)}/models`, expectedUrl);
    assert.deepEqual(await fetchDirectModels(provider, "private-key"), [textModel]);
  }
});

it("rejects an invalid credential before settings can be saved", async () => {
  globalThis.fetch = (async () => new Response(null, { status: 401 })) as typeof fetch;
  await assert.rejects(fetchDirectModels(AIProvider.OPENAI, "bad-key"), /rejected/);
});

it("uses the current OpenAI completion limit field", () => {
  assert.deepEqual(completionTokenLimit(AIProvider.OPENAI, 8192), { max_completion_tokens: 8192 });
  assert.deepEqual(completionTokenLimit(AIProvider.ANTHROPIC, 8192), { max_tokens: 8192 });
});
