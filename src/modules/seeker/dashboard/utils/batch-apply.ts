import { OptimizeMode } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";
import { buildApplyAiProfile } from "@/modules/seeker/apply/utils/build-apply-profile";
import type { ResumeOptimizeRequest } from "@/lib/validations/apply-ai.schema";
import type { FeedJobItem } from "@/modules/seeker/feed/types/feed.types";

interface ApplyServiceError extends Error {
  status?: number;
  data?: { id?: string | null };
}

/*
 * BatchApplyProfileContext
 * The seeker's real profile + tone, fetched once and reused across every job
 * in a batch — avoids re-fetching settings/certifications/projects per job.
 */
export interface BatchApplyProfileContext {
  profile: ResumeOptimizeRequest["profile"];
  tone: OptimizeMode;
}

export interface BatchApplyResult {
  jobId: string;
  jobTitle: string;
  companyName: string;
  success: boolean;
  error?: string;
}

/*
 * loadBatchApplyProfileContext
 * Fetches the settings/certifications/projects/optimize-mode the apply-AI
 * routes need, once per Apply-to-all run, in the same shape StepOptimize
 * builds per-job during the manual wizard.
 */
export async function loadBatchApplyProfileContext(): Promise<BatchApplyProfileContext> {
  const [settings, certifications, projects, optimizeMode] = await Promise.all([
    seekerService.getSettings(),
    seekerService.getCertifications(),
    seekerService.getProjects(),
    seekerService.getOptimizeMode(),
  ]);
  return {
    profile: buildApplyAiProfile(settings.data, certifications.data.certifications, projects.data.projects),
    tone: optimizeMode.data.optimizeMode,
  };
}

/*
 * generateApplicationArtifacts
 * One job's worth of Section D5 "Apply to all": create the Application (or
 * reuse an existing one on 409), generate the tailored resume + cover letter
 * (one AI credit, reserved by optimize-resume and redeemed — not re-reserved
 * — by cover-letter), then finalize with resume+coverLetter only (no
 * submittedFormData) so the row lands in Needs-you rather than Submitted.
 * Required/preferred skills are omitted — optimize-resume already falls back
 * to extracting them from the job description when none are supplied.
 * Isolated per job: any failure (rate limit, out of credits, generation
 * error) is caught and reported, never thrown, so one bad job can't stop the
 * rest of the batch.
 */
export async function generateApplicationArtifacts(
  job: Pick<FeedJobItem, "id" | "title" | "companyName">,
  ctx: BatchApplyProfileContext,
): Promise<BatchApplyResult> {
  const base = { jobId: job.id, jobTitle: job.title, companyName: job.companyName };
  try {
    let applicationId: string;
    try {
      const created = await seekerService.createApplication(job.id);
      applicationId = created.data.id;
    } catch (err) {
      const applyErr = err as ApplyServiceError;
      if (applyErr.status === 409 && applyErr.data?.id) {
        applicationId = applyErr.data.id;
      } else {
        throw err;
      }
    }

    const { resume, reservationHandle } = await seekerService.optimizeResume({
      jobId: job.id,
      jobTitle: job.title,
      company: job.companyName,
      tone: ctx.tone,
      profile: ctx.profile,
      requiredSkills: [],
      preferredSkills: [],
    });

    const { coverLetter } = await seekerService.generateCoverLetter({
      jobId: job.id,
      jobTitle: job.title,
      company: job.companyName,
      tone: ctx.tone,
      profile: ctx.profile,
      requiredSkills: [],
      preferredSkills: [],
      reservationHandle: reservationHandle ?? undefined,
    });

    await seekerService.finalizeApplication(applicationId, { resume, coverLetter });

    return { ...base, success: true };
  } catch (err) {
    return { ...base, success: false, error: err instanceof Error ? err.message : "Failed to generate application" };
  }
}
