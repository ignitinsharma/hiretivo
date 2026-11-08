import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";

const resume = {
  profileId: "owner",
  resumeVersionId: null,
  applicationId: null,
  sourceType: "uploaded",
  generatedAt: "2026-01-01T00:00:00.000Z",
  personalInfo: { name: "Alex", email: "alex@example.com", phone: "", location: null, linkedin: null, github: null, websiteUrl: null, twitter: null },
  summary: "Original summary",
  experience: [], projects: [], education: [], skills: { categories: [] }, certifications: [], languages: [],
};

let userId: string | null = "owner";
let saved: typeof resume | null = { ...resume };
let savedStyle: unknown = null;
let versionWrites = 0;

before(() => {
  mock.module("@/auth", { namedExports: { auth: async () => userId ? { user: { id: userId, role: "SEEKER" } } : null } });
  mock.module("@/lib/prisma", { namedExports: { prisma: {
    seekerProfile: { findUnique: async () => ({ resumeKey: null }) },
    masterResume: {
      findUnique: async () => saved ? { id: "master-1", resumeJson: saved, styleConfig: savedStyle, updatedAt: new Date("2026-01-01") } : null,
      upsert: async ({ update, create }: { update: { resumeJson: typeof resume; styleConfig: unknown }, create: { resumeJson: typeof resume; styleConfig: unknown } }) => {
        saved = saved ? update.resumeJson : create.resumeJson;
        savedStyle = savedStyle ? update.styleConfig : create.styleConfig;
        return { id: "master-1", resumeJson: saved, styleConfig: savedStyle, updatedAt: new Date("2026-01-02") };
      },
    },
    resumeVersion: { create: async () => { versionWrites++; } },
  } } });
  mock.module("@/lib/rate-limit", { namedExports: {
    dataFetchRateLimiter: { limit: async () => ({ success: true }) },
    writeRateLimiter: { limit: async () => ({ success: true }) },
    createRateLimiter: () => ({ limit: async () => ({ success: true }) }),
  } });
});

after(() => mock.restoreAll());

describe("base resume API", () => {
  it("lets the owner save edited sections without altering existing versions", async () => {
    const { GET, PUT } = await import("../route");
    const before = await GET();
    assert.equal((await before.json()).data.resumeJson.summary, "Original summary");

    const changed = { ...resume, summary: "Updated summary" };
    const request = new Request("http://localhost/api/resume/base", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeJson: changed }),
    });
    const response = await PUT(request);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.resumeJson.summary, "Updated summary");
    assert.equal(saved?.summary, "Updated summary");
    assert.equal(versionWrites, 0);
  });

  it("rejects unauthenticated access", async () => {
    const { GET } = await import("../route");
    userId = null;
    assert.equal((await GET()).status, 401);
    userId = "owner";
  });

  it("offers an editable blank document and binds saved metadata to the owner", async () => {
    const { GET, PUT } = await import("../route");
    saved = null;
    const blank = (await (await GET()).json()).data.resumeJson;
    assert.equal(blank.profileId, "owner");
    assert.equal(blank.summary, "");

    const response = await PUT(new Request("http://localhost/api/resume/base", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeJson: {
        ...blank, profileId: "another-user", applicationId: "app-1", resumeVersionId: "version-1",
        matchMeta: { matchScore: 100, addedKeywords: [], missingKeywords: [], requiredSkillsMatched: 0, requiredSkillsTotal: 0, preferredSkillsMatched: 0, preferredSkillsTotal: 0 },
      } }),
    }));
    assert.equal(response.status, 200);
    const persisted = (await (await GET()).json()).data.resumeJson;
    assert.equal(persisted.profileId, "owner");
    assert.equal(persisted.applicationId, null);
    assert.equal(persisted.resumeVersionId, null);
    assert.equal("matchMeta" in persisted, false);
  });

  it("rejects malformed documents without replacing the saved resume", async () => {
    const { PUT } = await import("../route");
    const previous = saved;
    const response = await PUT(new Request("http://localhost/api/resume/base", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeJson: { summary: "Bad input" } }),
    }));
    assert.equal(response.status, 422);
    assert.equal(saved, previous);
  });

  it("recognizes a manually created base resume without an uploaded file", async () => {
    const { GET } = await import("../../parse-status/route");
    assert.equal((await (await GET()).json()).status, "parsed");
  });

  it("saves the selected presentation with the base resume for future visits", async () => {
    const { GET, PUT } = await import("../route");
    const { BUILT_IN_THEMES } = await import("../../../../../lib/resume/style/built-in-themes");
    assert.equal(BUILT_IN_THEMES.length, 12);
    const styleConfig = BUILT_IN_THEMES[7].config;
    const response = await PUT(new Request("http://localhost/api/resume/base", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeJson: saved, styleConfig }),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual((await (await GET()).json()).data.styleConfig, styleConfig);
  });

  it("exports a valid PDF using the selected paper size", async () => {
    const { POST } = await import("../../preview-pdf/route");
    const { PDFDocument } = await import("pdf-lib");
    const { BUILT_IN_THEMES } = await import("../../../../../lib/resume/style/built-in-themes");
    const response = await POST(new Request("http://localhost/api/resume/preview-pdf", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeJson: saved, styleConfig: { ...BUILT_IN_THEMES[7].config, paperSize: "a4" } }),
    }) as Parameters<typeof POST>[0]);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    const pdf = await PDFDocument.load(await response.arrayBuffer());
    assert.equal(Math.round(pdf.getPage(0).getWidth()), 595);
  });
});
