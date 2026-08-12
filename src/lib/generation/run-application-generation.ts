import { AutomationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/ai/resume-tailor";
import { stripHtml } from "@/lib/utils";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { GenerationJobMessage } from "@/lib/generation/qstash";

/* Runs a queued resume generation and records a terminal application status. */
export async function runApplicationGeneration(
  message: GenerationJobMessage,
): Promise<void> {
  const application = await prisma.application.findFirst({
    where: { id: message.applicationId, seekerId: message.userId },
    select: {
      id: true,
      job: {
        select: {
          title: true,
          description: true,
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
  });

  if (!application) return;

  const activeRun = await prisma.application.findFirst({
    where: {
      id: message.applicationId,
      seekerId: message.userId,
      automationRunId: message.runId,
      automationStatus: AutomationStatus.GENERATING,
    },
    select: { id: true },
  });
  if (!activeRun) return;

  const masterResume = await prisma.masterResume.findUnique({
    where: { userId: message.userId },
  });
  if (!masterResume) {
    await markGenerationFailed(message, "No master resume found — upload one first");
    return;
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: message.userId },
    select: { linkedinUrl: true, githubUrl: true, websiteUrl: true },
  });

  const jdText = message.jdText.trim() || stripHtml(application.job.description ?? "").trim();
  if (!jdText) {
    await markGenerationFailed(message, "No job description available");
    return;
  }

  const baseResume = (message.baseResumeJson ?? masterResume.resumeJson) as ResumeDocument;
  const enrichedResume: ResumeDocument = {
    ...baseResume,
    personalInfo: {
      ...baseResume.personalInfo,
      linkedin: baseResume.personalInfo.linkedin || seekerProfile?.linkedinUrl || null,
      github: baseResume.personalInfo.github || seekerProfile?.githubUrl || null,
      websiteUrl: baseResume.personalInfo.websiteUrl || seekerProfile?.websiteUrl || null,
    },
  };

  const result = await tailorResume({
    userId: message.userId,
    applicationId: message.applicationId,
    masterResumeJson: enrichedResume,
    jdText,
    jobSkills: application.job.skills.map((js) => js.skill.name),
    jobTitle: application.job.title,
  });

  if (result.status === "success") {
    await prisma.application.updateMany({
      where: {
        id: message.applicationId,
        seekerId: message.userId,
        automationRunId: message.runId,
      },
      data: {
        automationStatus: AutomationStatus.READY,
        failureReason: null,
      },
    });
    return;
  }

  const reason = result.status === "quota_exceeded"
    ? "Generation limit reached"
    : result.status === "rate_limited"
      ? "Generation rate limit reached — please retry shortly"
      : result.status === "ai_error" && result.reason === "unreadable_jd"
        ? "Job description unreadable — edit and paste manually"
        : "AI generation failed — please retry";
  await markGenerationFailed(message, reason);
}

async function markGenerationFailed(
  message: GenerationJobMessage,
  failureReason: string,
): Promise<void> {
  await prisma.application.updateMany({
    where: {
      id: message.applicationId,
      seekerId: message.userId,
      automationRunId: message.runId,
    },
    data: { automationStatus: AutomationStatus.FAILED, failureReason },
  });
}
