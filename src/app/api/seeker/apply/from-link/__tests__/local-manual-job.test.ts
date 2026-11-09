import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

let aiCalls = 0;

before(() => {
  mock.module("@/auth", { namedExports: { auth: async () => ({ user: { id: "local-user" } }) } });
  mock.module("@/lib/config", { namedExports: { SELF_HOSTED: true } });
  mock.module("@/lib/prisma", { namedExports: { prisma: {
    job: { create: async () => ({ id: "job-1" }) },
    application: { create: async () => ({ id: "app-1" }) },
  } } });
  mock.module("@/lib/ai/jd-parser", { namedExports: {
    parseJobFromText: async () => { aiCalls++; throw new Error("AI must not be needed"); },
    parseJobFromUrl: async () => null,
    isSupportedAtsDomain: () => false,
    isAshbyUrl: () => false,
  } });
  mock.module("@/lib/ai/skill-catalog-extractor", { namedExports: { extractCandidateSkillsFromJD: async () => [], reconcileAndInsertSkills: async () => {}, upsertJobSkillIds: () => [] } });
});

after(() => mock.restoreAll());

it("previews a manually entered job without calling a model", async () => {
  const { POST } = await import("../route");
  const response = await POST(new Request("http://localhost/api/seeker/apply/from-link", { method: "POST", body: JSON.stringify({ pastedText: "Build local software using TypeScript and PostgreSQL for a distributed product team.", title: "Engineer", company: "Acme", previewOnly: true }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.preview.title, "Engineer");
  assert.equal(body.preview.company, "Acme");
  assert.equal(aiCalls, 0);
});

it("saves the manual job and application without a configured model", async () => {
  const { POST } = await import("../route");
  const response = await POST(new Request("http://localhost/api/seeker/apply/from-link", { method: "POST", body: JSON.stringify({ pastedText: "Build local software using TypeScript and PostgreSQL for a distributed product team.", title: "Engineer", company: "Acme", previewOnly: false }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.applicationId, "app-1");
  assert.equal(aiCalls, 0);
});
