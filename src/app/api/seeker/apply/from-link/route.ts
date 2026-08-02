import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ApplyFromLinkSchema,
  ApplyFromTextSchema,
  JobPreviewSchema,
  type JobPreview,
} from "@/lib/validations/apply-from-link.schema";
import { parseJobFromUrl, parseJobFromText, isUnsupportedAtsDomain } from "@/lib/ai/jd-parser";
import { extractCandidateSkillsFromJD, reconcileAndInsertSkills } from "@/lib/ai/skill-catalog-extractor";
import { upsertJobSkillIds } from "@/services/ats-job-fetcher.service";
import { SkillLevel } from "@/constants/enums";
import { JobStatus } from "@/constants/enums";

function tryPreviewData(raw: unknown): JobPreview | null {
  if (!raw) return null;
  const parsed = JobPreviewSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function enrichAndLinkJobSkills(jobId: string, description: string, parsedSkills: string[] = []): Promise<void> {
  // Prefer the JD parser's skill list (LLM-extracted with the full description);
  // fall back to description extraction only when the parser found nothing.
  const candidates = parsedSkills.length
    ? parsedSkills.map((name) => ({ name, category: "tool" as const }))
    : await extractCandidateSkillsFromJD(description);
  if (candidates.length === 0) return;
  const result = await reconcileAndInsertSkills(candidates);
  if (result.created.length === 0 && result.aliasesAdded.length === 0) return;
  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true, aliases: true } });
  const skillIds = upsertJobSkillIds(
    [...new Set([...result.created.map((s) => s.name), ...result.aliasesAdded.map((a) => a.skillName)])],
    allSkills,
  );
  if (skillIds.length > 0) {
    await prisma.jobSkill.createMany({
      data: skillIds.map((skillId) => ({ jobId, skillId, level: SkillLevel.INTERMEDIATE })),
      skipDuplicates: true,
    });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.pastedText) {
    const parsed = ApplyFromTextSchema.safeParse({
      title: body.title,
      company: body.company,
      description: body.pastedText,
      previewOnly: body.previewOnly,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    let jobData = tryPreviewData(body.previewData) as JobPreview | null;
    if (!jobData) {
      jobData = await parseJobFromText(parsed.data.description);
    }
    if (!jobData) {
      return NextResponse.json(
        { error: "Could not parse job description. Please ensure it includes the job title, company, and responsibilities." },
        { status: 422 },
      );
    }

    const preview: JobPreview = {
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      skills: jobData.skills,
    };

    if (parsed.data.previewOnly) {
      return NextResponse.json({ preview });
    }

    const job = await prisma.job.create({
      data: {

        title: jobData.title,
        description: jobData.description,
        jobType: "FULL_TIME",
        applyType: "EXTERNAL",
        status: JobStatus.OPEN,
        companyName: jobData.company,
      },
    });

    await enrichAndLinkJobSkills(job.id, jobData.description, jobData.skills);

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        seekerId: session.user.id,
        status: "APPLIED",
        matchScore: 0,
      },
    });

    return NextResponse.json({
      preview,
      applicationId: application.id,
      jobId: job.id,
    });
  }

  const parsed = ApplyFromLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { url, previewOnly } = parsed.data;

  const existing = await prisma.application.findFirst({
    where: { seekerId: session.user.id },
    include: { job: { select: { externalApplyUrl: true } } },
  });

  // TEMP DISABLED for testing — restore duplicate-link check:
  // if (existing?.job?.externalApplyUrl === url) {
  //   return NextResponse.json(
  //     { error: "You have already applied to this job from this link." },
  //     { status: 409 },
  //   );
  // }

  let jobData = tryPreviewData(body.previewData) as JobPreview | null;
  if (!jobData) {
    jobData = await parseJobFromUrl(url);
  }
  if (!jobData) {
    const unsupportedAts = isUnsupportedAtsDomain(url);
    return NextResponse.json(
      {
        error: unsupportedAts
          ? "This job board isn't supported for auto-fetch. Switch to 'Paste Description' and copy the job details instead."
          : "Could not parse job from this URL. Try pasting the job description instead.",
        unsupportedAts,
      },
      { status: 422 },
    );
  }

  const preview: JobPreview = {
    title: jobData.title,
    company: jobData.company,
    description: jobData.description,
    skills: jobData.skills,
  };

  if (previewOnly) {
    return NextResponse.json({ preview });
  }

  const job = await prisma.job.create({
    data: {
      title: jobData.title,
      description: jobData.description,
      jobType: "FULL_TIME",
      applyType: "EXTERNAL",
      status: JobStatus.OPEN,
      externalApplyUrl: url,
      companyName: jobData.company,
    },
  });

  await enrichAndLinkJobSkills(job.id, jobData.description, jobData.skills);

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      seekerId: session.user.id,
      status: "APPLIED",
      matchScore: 0,
    },
  });

  return NextResponse.json({
    preview,
    applicationId: application.id,
    jobId: job.id,
  });
}
