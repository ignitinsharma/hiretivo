import assert from "node:assert/strict";
import { after, it, mock } from "node:test";
import { fetchOpenRouterModels } from "../openrouter-models";

after(() => mock.restoreAll());

it("shows current free chat models and records whether PDF input is supported", async () => {
  mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ data: [
    { id: "fixture/free:free", name: "Free", architecture: { input_modalities: ["text"], output_modalities: ["text"] }, pricing: { prompt: "0", completion: "0" }, context_length: 32768 },
    { id: "fixture/pdf", name: "PDF", architecture: { input_modalities: ["text", "file"], output_modalities: ["text"] }, pricing: { prompt: "0.001", completion: "0.002" }, context_length: 65536 },
    { id: "fixture/image", name: "Image", architecture: { input_modalities: ["image"], output_modalities: ["image"] }, pricing: { prompt: "0", completion: "0" } },
  ] }), { status: 200 }));
  const models = await fetchOpenRouterModels("private-key");
  assert.deepEqual(models.map(({ id, isFree, supportsFile, promptPricePerMillion }) => ({ id, isFree, supportsFile, promptPricePerMillion })), [
    { id: "fixture/free:free", isFree: true, supportsFile: false, promptPricePerMillion: 0 },
    { id: "fixture/pdf", isFree: false, supportsFile: true, promptPricePerMillion: 1000 },
  ]);
});
