import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";

const calls: Array<{ model: string; userId: string }> = [];
const resume = {
  profileId: "__profile_placeholder__", resumeVersionId: null, applicationId: null,
  sourceType: "uploaded", generatedAt: new Date().toISOString(),
  personalInfo: { name: "Local User", email: "local@example.test", phone: "", location: null, linkedin: null, github: null, websiteUrl: null, twitter: null },
  summary: "Engineer with experience building distributed systems.",
  experience: [], projects: [], education: [],
  skills: { categories: [{ name: "Languages", items: ["TypeScript", "Python", "SQL"] }] },
  certifications: [], languages: [],
};

before(() => {
  mock.module("@/lib/ai/pdf-text-extract", { namedExports: { extractPdfText: async () => "Resume text with TypeScript, Python and SQL experience. ".repeat(5) } });
  mock.module("@/lib/openrouter", { namedExports: { getUserAIContext: async (userId: string) => ({
    model: "selected/openrouter-model", supportsFile: false,
    client: { chat: { completions: { create: async (request: { model: string }) => {
      calls.push({ model: request.model, userId });
      return { choices: [{ message: { content: JSON.stringify(resume) }, finish_reason: "stop" }] };
    } } } },
  }) } });
});

after(() => mock.restoreAll());

it("parses an uploaded resume with the account's selected OpenRouter model", async () => {
  const { parseResumeWithVision } = await import("../resume-parser");
  const result = await parseResumeWithVision(Buffer.from("%PDF-1.7 fixture"), "local-user");
  assert.equal(result.status, "ok");
  assert.deepEqual(calls, [{ model: "selected/openrouter-model", userId: "local-user" }]);
  if (result.status === "ok") assert.equal(result.data.personalInfo.name, "Local User");
});
