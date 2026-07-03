import { openrouter, getAIModel } from "@/lib/openrouter";
import {
  buildResumeOptimizeMessages,
  buildCoverLetterMessages,
  parseResumeDocument,
  RESUME_OPTIMIZE_CONFIG,
  COVER_LETTER_CONFIG,
  type SeekerProfileForAi,
  type JobForAi,
} from "@/lib/ai-prompts";
import { computeKeywordStats } from "@/lib/apply/keyword-match";
import { OptimizeMode, AiMessageRole } from "@/constants/enums";

/*
 * main
 * Real-JD smoke test for the Phase 4 apply-AI prompt builders + parser,
 * calling the model directly (no HTTP route auth/session available in this
 * script context — mirrors the resume:smoke precedent from Phase 3b).
 * Confirms: buildResumeOptimizeMessages -> model -> parseResumeDocument
 * round-trips into a valid ResumeDocument, and buildCoverLetterMessages ->
 * model produces a non-empty, JD-specific cover letter.
 */
async function main(): Promise<void> {
  const profile: SeekerProfileForAi = {
    fullName: "Ada Lovelace",
    headline: "Senior Backend Engineer",
    primaryRole: "Backend Engineer",
    yearsExperience: 8,
    bio: "Backend engineer with 8 years building distributed payments systems.",
    location: "London, UK",
    contact: { email: "ada@example.com", location: "London, UK", githubUrl: "https://github.com/ada" },
    skillGroups: [
      { category: "Engineering", skills: ["Go", "Node.js", "PostgreSQL", "Kubernetes"] },
      { category: "Data", skills: ["Redis"] },
    ],
    workExperiences: [
      {
        company: "Analytical Engines",
        title: "Staff Engineer",
        startDate: "01/2020",
        endDate: null,
        description: "Led a rewrite of the payments processing pipeline on PostgreSQL, cut p99 latency 40% by introducing connection pooling and query batching.",
      },
      {
        company: "Babbage Co",
        title: "Senior Engineer",
        startDate: "06/2016",
        endDate: "12/2019",
        description: "Built the event ingestion pipeline handling 5M events/day using Node.js and Kafka.",
      },
    ],
    educations: [{ institution: "University of London", degree: "BSc", major: "Mathematics", graduationDate: "2015" }],
    certifications: [{ name: "Certified Kubernetes Administrator", issuer: "CNCF", issueDate: "2022" }],
    projects: [],
  };

  const job: JobForAi = {
    title: "Senior Backend Engineer",
    company: "Stripe",
    descriptionText: `We're hiring a Senior Backend Engineer to own core payments infrastructure. You will design and build scalable services in Go and PostgreSQL, own end-to-end delivery of payment features, and work closely with the platform team on Kubernetes-based deployments. Requirements: 5+ years building production backend systems, deep experience with PostgreSQL and distributed systems, familiarity with Kubernetes. Nice to have: experience with Redis, gRPC.`,
    requiredSkills: ["Go", "PostgreSQL", "Kubernetes"],
    preferredSkills: ["Redis", "gRPC"],
  };

  const seekerSkillNames = profile.skillGroups.flatMap((g) => g.skills);
  const { requiredMatchedSkills, requiredMissingSkills, preferredMatchedSkills } = computeKeywordStats(
    job.requiredSkills,
    job.preferredSkills,
    seekerSkillNames,
  );
  const matchedSkills = [...requiredMatchedSkills, ...preferredMatchedSkills];
  console.log("keywordStats:", { requiredMatchedSkills, requiredMissingSkills, preferredMatchedSkills });

  // --- Resume optimize ---
  const resumeMessages = buildResumeOptimizeMessages({
    profile,
    job,
    matchedSkills,
    missingSkills: requiredMissingSkills,
    tone: OptimizeMode.HONEST,
  });
  const resumeCompletion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...RESUME_OPTIMIZE_CONFIG,
    messages: [
      { role: AiMessageRole.SYSTEM, content: resumeMessages.system },
      { role: AiMessageRole.USER, content: resumeMessages.user },
    ],
  });
  const resumeRaw = resumeCompletion.choices[0]?.message?.content ?? "";
  const resumeDoc = parseResumeDocument(resumeRaw);
  if (!resumeDoc) {
    console.error("RESUME PARSE FAILED. Raw output:\n", resumeRaw);
    process.exit(1);
  }
  console.log("Resume optimize OK. Parsed ResumeDocument:");
  console.log(JSON.stringify(resumeDoc, null, 2));

  // --- Cover letter ---
  const coverMessages = buildCoverLetterMessages({
    profile,
    job,
    matchedSkills,
    tone: OptimizeMode.HONEST,
  });
  const coverCompletion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...COVER_LETTER_CONFIG,
    messages: [
      { role: AiMessageRole.SYSTEM, content: coverMessages.system },
      { role: AiMessageRole.USER, content: coverMessages.user },
    ],
  });
  const coverLetter = coverCompletion.choices[0]?.message?.content ?? "";
  if (!coverLetter.trim()) {
    console.error("COVER LETTER EMPTY");
    process.exit(1);
  }
  console.log("\nCover letter OK:\n", coverLetter);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
