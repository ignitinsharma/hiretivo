import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";
import { AIProvider } from "@prisma/client";

let calls = 0;
const resume = {
  profileId: "__profile_placeholder__", resumeVersionId: null, applicationId: null,
  sourceType: "uploaded", generatedAt: new Date().toISOString(),
  personalInfo: { name: "Claude User", email: "claude@example.test", phone: "", location: null, linkedin: null, github: null, websiteUrl: null, twitter: null },
  summary: "Engineer with experience building distributed systems.",
  experience: [], projects: [], education: [],
  skills: { categories: [{ name: "Languages", items: ["TypeScript", "Python", "SQL"] }] },
  certifications: [], languages: [],
};

before(() => {
  mock.module("@/lib/ai/pdf-text-extract", { namedExports: { extractPdfText: async () => "Resume text with TypeScript, Python and SQL experience. ".repeat(5) } });
  mock.module("@/lib/openrouter", { namedExports: { getUserAIContext: async () => ({
    model: "claude-sonnet-5", provider: AIProvider.ANTHROPIC, supportsFile: false,
    client: { chat: { completions: { create: async (request: Record<string, unknown>) => {
      calls += 1;
      assert.equal(request.model, "claude-sonnet-5");
      assert.ok(!("response_format" in request));
      assert.ok(!("temperature" in request));
      assert.ok(!("reasoning" in request));
      return { choices: [{ message: { content: JSON.stringify(resume) }, finish_reason: "stop" }] };
    } } } },
  }) } });
});

after(() => mock.restoreAll());

it("parses a text PDF with Anthropic-compatible request fields", async () => {
  const { parseResumeWithVision } = await import("../resume-parser");
  const result = await parseResumeWithVision(Buffer.from("%PDF-1.7 fixture"), "user");
  assert.equal(result.status, "ok");
  assert.equal(calls, 1);
  if (result.status === "ok") assert.equal(result.data.personalInfo.name, "Claude User");
});
