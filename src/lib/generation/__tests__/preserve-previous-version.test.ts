import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

const application = { automationStatus: "GENERATING", automationRunId: "run-2", activeVersionId: "version-1", failureReason: null as string | null };
let aiCalls = 0;

before(() => {
  mock.module("@/lib/ai/resume-tailor", { namedExports: { tailorResume: async () => { aiCalls++; return { status: "ai_error", reason: "malformed_response" }; } } });
  mock.module("@/lib/prisma", { namedExports: { prisma: {
    application: {
      findFirst: async ({ where }: { where: { automationRunId?: string } }) => where.automationRunId
        ? { id: "app-1" }
        : { id: "app-1", job: { title: "Engineer", description: "Build a local application with PostgreSQL and TypeScript.", skills: [] } },
      updateMany: async ({ data }: { data: { automationStatus: string; failureReason: string | null } }) => { Object.assign(application, data); },
    },
    masterResume: { findUnique: async () => ({ resumeJson: { personalInfo: { linkedin: null, github: null, websiteUrl: null } } }) },
    seekerProfile: { findUnique: async () => null },
  } } });
});

after(() => mock.restoreAll());

it("marks a failed retry without replacing an earlier active resume version", async () => {
  const { runApplicationGeneration } = await import("../run-application-generation");
  await runApplicationGeneration({ applicationId: "app-1", userId: "owner", runId: "run-2", jdText: "Build a local application with PostgreSQL and TypeScript.", forceGenerate: true });
  assert.equal(aiCalls, 1);
  assert.equal(application.automationStatus, "FAILED");
  assert.equal(application.activeVersionId, "version-1");
  assert.match(application.failureReason ?? "", /AI generation failed/);
});
