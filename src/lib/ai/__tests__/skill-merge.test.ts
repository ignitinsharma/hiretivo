import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import { mergeExtractedSkills } from "../skill-merge";

const BASE: ResumeDocument = {
  profileId: "__profile_placeholder__",
  resumeVersionId: null,
  applicationId: null,
  sourceType: "uploaded",
  generatedAt: new Date().toISOString(),
  personalInfo: {
    name: "Test User", email: "t@t.com", phone: "", location: null,
    linkedin: null, github: null, websiteUrl: null, twitter: null,
  },
  summary: "Built data pipelines at a fintech company.",
  experience: [
    {
      id: "e1", company: "Acme", title: "Engineer", location: null,
      startDate: "Jan 2020", endDate: null, current: true,
      bullets: [
        { id: "b1", text: "Built ETL pipelines in Python and SQL", priority: 1 },
        { id: "b2", text: "Deployed to AWS using Terraform", priority: 1 },
      ],
    },
  ],
  projects: [],
  education: [],
  skills: { categories: [{ name: "Languages", items: ["Python"] }] },
  certifications: [],
  languages: [],
};

describe("mergeExtractedSkills", () => {
  it("adds keywords from bullets to the skills section", () => {
    const merged = mergeExtractedSkills(BASE);
    const all = merged.skills.categories.flatMap((c) => c.items);
    assert.ok(all.includes("AWS"));
    assert.ok(all.includes("Terraform"));
  });

  it("does not duplicate existing skills", () => {
    const merged = mergeExtractedSkills(BASE);
    const all = merged.skills.categories.flatMap((c) => c.items);
    assert.equal(all.filter((s) => s === "Python").length, 1);
  });

  it("does not add stoplist words or sentence-leading verbs", () => {
    const merged = mergeExtractedSkills(BASE);
    const all = merged.skills.categories.flatMap((c) => c.items);
    assert.ok(!all.includes("Built"));
    assert.ok(!all.includes("Deployed"));
    assert.ok(!all.includes("The"));
  });

  it("leaves the input document untouched", () => {
    const before = JSON.stringify(BASE.skills);
    mergeExtractedSkills(BASE);
    assert.equal(JSON.stringify(BASE.skills), before);
  });
});
