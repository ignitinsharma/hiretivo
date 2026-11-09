import assert from "node:assert/strict";
import { after, it, mock } from "node:test";
import { fetchLocalModels, normalizeLocalEndpoint } from "../local-endpoint";

after(() => mock.restoreAll());

it("accepts only loopback or Docker host endpoints", () => {
  assert.equal(normalizeLocalEndpoint("http://localhost:11434/v1/"), "http://localhost:11434/v1");
  assert.equal(normalizeLocalEndpoint("http://host.docker.internal:1234/v1"), "http://host.docker.internal:1234/v1");
  for (const endpoint of ["https://localhost:11434/v1", "http://example.com/v1", "http://127.0.0.1:11434/admin", "http://user:pass@localhost:11434/v1"]) {
    assert.throws(() => normalizeLocalEndpoint(endpoint));
  }
});

it("reads installed models from a local OpenAI-compatible fixture", async () => {
  const oldFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return Response.json({ data: [{ id: "local-model" }, { id: "second-model" }] });
  }) as typeof fetch;
  try {
    assert.deepEqual(await fetchLocalModels("http://localhost:11434/v1"), ["local-model", "second-model"]);
    assert.deepEqual(calls, ["http://localhost:11434/v1/models"]);
  } finally { globalThis.fetch = oldFetch; }
});
