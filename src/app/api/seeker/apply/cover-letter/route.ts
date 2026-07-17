import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/ai/cover-letter-generator";
import type { CoverLetterInput } from "@/lib/ai-prompts";

export async function POST(request: Request) {
  try {
    const body: CoverLetterInput = await request.json();

    if (!body.jdText || !body.resumeName) {
      return NextResponse.json(
        { error: "jdText and resumeName are required" },
        { status: 400 },
      );
    }

    const result = await generateCoverLetter(
      {
        personalInfo: { name: body.resumeName, email: "", phone: "", location: "", linkedin: null, github: null, websiteUrl: null, twitter: null },
        summary: body.resumeSummary ?? "",
        skills: { categories: [{ name: "Skills", items: body.resumeSkills ?? [] }] },
        experience: [],
        education: [],
        certifications: [],
        languages: [],
        projects: [],
        profileId: "",
        resumeVersionId: null,
        applicationId: null,
        sourceType: "ai-generated",
        generatedAt: new Date().toISOString(),
        matchMeta: { matchScore: 0, addedKeywords: [], missingKeywords: [], requiredSkillsMatched: 0, requiredSkillsTotal: 0, preferredSkillsMatched: 0, preferredSkillsTotal: 0 },
      },
      body.jdText,
      body.jobTitle ?? "",
      body.company ?? "",
    );

    if (result.status !== "success") {
      return NextResponse.json(
        { error: "Failed to generate cover letter" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: result.raw });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 },
    );
  }
}
