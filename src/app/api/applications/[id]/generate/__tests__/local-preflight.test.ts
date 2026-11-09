import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

let writes = 0;
let dispatches = 0;

before(() => {
  mock.module("@/auth", { namedExports: { auth: async () => ({ user: { id: "owner" } }) } });
  mock.module("@/lib/config", { namedExports: { SELF_HOSTED: true } });
  mock.module("@/lib/prisma", { namedExports: { prisma: {
    application: {
      findFirst: async () => ({ id: "app-1", automationStatus: "NOT_STARTED", job: { description: "Build a software application with a long job description." } }),
      update: async () => { writes++; },
    },
    masterResume: { findUnique: async () => ({ id: "resume-1" }) },
    aISettings: { findUnique: async () => null },
  } } });
  mock.module("@/lib/generation/dispatch-generation", { namedExports: { dispatchGenerationJob: async () => { dispatches++; return { queued: false }; } } });
});

after(() => mock.restoreAll());

it("keeps a saved application intact and asks for model setup before generation", async () => {
  const { POST } = await import("../route");
  const response = await POST({ nextUrl: new URL("http://localhost/api/applications/app-1/generate") } as never, { params: Promise.resolve({ id: "app-1" }) });
  assert.equal(response.status, 412);
  assert.equal((await response.json()).error, "model_not_configured");
  assert.equal(writes, 0);
  assert.equal(dispatches, 0);
});
