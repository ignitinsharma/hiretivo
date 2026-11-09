import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

let inlineCalls = 0;
let queuedCalls = 0;
const previousNodeEnv = process.env.NODE_ENV;

before(() => {
  Reflect.set(process.env, "NODE_ENV", "production");
  mock.module("@/lib/config", { namedExports: { SELF_HOSTED: true } });
  mock.module("@/lib/generation/qstash", { namedExports: { publishGenerationJob: async () => { queuedCalls++; } } });
  mock.module("@/lib/generation/run-application-generation", { namedExports: { runApplicationGeneration: async () => { inlineCalls++; } } });
  mock.module("@/lib/prisma", { namedExports: { prisma: {} } });
});

after(() => {
  Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
  mock.restoreAll();
});

it("runs a production self-hosted generation locally without QStash", async () => {
  const { dispatchGenerationJob } = await import("../dispatch-generation");
  const result = await dispatchGenerationJob({ applicationId: "app", userId: "user", runId: "run", jdText: "A full local job description", forceGenerate: true }, "http://localhost:3000/api/applications/app/generate");
  assert.deepEqual(result, { queued: false });
  assert.equal(inlineCalls, 1);
  assert.equal(queuedCalls, 0);
});
