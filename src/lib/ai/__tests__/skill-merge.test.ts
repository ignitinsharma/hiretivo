import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import { mergeExtractedSkills, mergeJdSkills } from "../skill-merge";

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

const JD_BASE: ResumeDocument = {
  ...BASE,
  skills: {
    categories: [
      { name: "AI / LLM", items: ["OpenAI APIs", "Prompt Engineering"] },
      { name: "Backend", items: ["Node.js", "REST APIs"] },
      { name: "Cloud & Tools", items: ["Vercel", "Git"] },
    ],
  },
};

describe("mergeJdSkills", () => {
  it("adds a JD skill to the best-matching category by token overlap", () => {
    const merged = mergeJdSkills(JD_BASE, ["APIs", "AI/LLM-based tools", "Debugging"]);
    const byCat = Object.fromEntries(
      merged.skills.categories.map((c) => [c.name, c.items]),
    );
    assert.ok(byCat["Backend"].includes("APIs"));
    assert.ok(byCat["AI / LLM"].includes("AI/LLM-based tools"));
    assert.ok(byCat["Cloud & Tools"].includes("Debugging"));
  });

  it("does not duplicate existing skills, even with different casing", () => {
    const merged = mergeJdSkills(JD_BASE, ["node.js", "REST APIs", "GIT"]);
    const all = merged.skills.categories.flatMap((c) => c.items);
    assert.equal(all.filter((s) => s.toLowerCase() === "node.js").length, 1);
    assert.equal(all.filter((s) => s.toLowerCase() === "git").length, 1);
    assert.equal(all.length, 6);
  });

  it("is a no-op on empty or duplicate-only skill lists", () => {
    assert.equal(JSON.stringify(mergeJdSkills(JD_BASE, [])), JSON.stringify(JD_BASE));
    const dupes = mergeJdSkills(JD_BASE, ["Vercel", "vercel", "GIT", "git"]);
    assert.equal(JSON.stringify(dupes), JSON.stringify(JD_BASE));
  });

  it("creates a fallback category when no tools-ish category exists", () => {
    const noTools: ResumeDocument = {
      ...JD_BASE,
      skills: { categories: [{ name: "Languages", items: ["Python"] }] },
    };
    const merged = mergeJdSkills(noTools, ["Debugging"]);
    assert.ok(merged.skills.categories.some((c) => c.name === "Tools & Technologies"));
    assert.ok(
      merged.skills.categories
        .find((c) => c.name === "Tools & Technologies")!
        .items.includes("Debugging"),
    );
  });

  it("caps additions to keep the section from bloating", () => {
    const many = Array.from({ length: 50 }, (_, i) => `Skill${i} Thing${i}`);
    const merged = mergeJdSkills(JD_BASE, many);
    const added = merged.skills.categories.flatMap((c) => c.items).length - 7;
    assert.ok(added <= 20);
  });

  it("leaves the input document untouched", () => {
    const before = JSON.stringify(JD_BASE.skills);
    mergeJdSkills(JD_BASE, ["APIs"]);
    assert.equal(JSON.stringify(JD_BASE.skills), before);
  });
});
