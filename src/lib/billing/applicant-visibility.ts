import { prisma } from "@/lib/prisma";

/*
 * FREE_APPLICANT_LIMIT
 * Max applicants a FREE recruiter can fully view per job.
 * Applicants beyond this are locked (PII redacted) until the recruiter upgrades.
 * Paid plans (STARTER/GROWTH/SCALE) have no cap.
 */
export const FREE_APPLICANT_LIMIT = 25;

/*
 * getFreeVisibleApplicationIds
 * Computes the set of application IDs a FREE recruiter is allowed to fully view.
 * Cap is per-job: the newest FREE_APPLICANT_LIMIT applications per job are visible.
 * Ordering matches the applications list ([createdAt desc, id desc]) so the list,
 * drawer, and per-record guards all agree on the same visible 25.
 * Computed from the UNFILTERED per-job ordering (ignores search/stage) so filtering
 * cannot reveal a locked applicant.
 * @param recruiterId - The recruiter (job owner) user id
 * @param jobId - Optional scope to a single job; omit to compute across all owned jobs
 * @returns Set of visible application IDs
 */
export async function getFreeVisibleApplicationIds(
  recruiterId: string,
  jobId?: string,
): Promise<Set<string>> {
  const rows = await prisma.application.findMany({
    where: {
      job: { recruiterId },
      jobId: { not: null },
      ...(jobId ? { jobId } : {}),
    },
    select: { id: true, jobId: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const perJobCount = new Map<string, number>();
  const visible = new Set<string>();

  for (const row of rows) {
    if (!row.jobId) continue;
    const seen = perJobCount.get(row.jobId) ?? 0;
    if (seen < FREE_APPLICANT_LIMIT) {
      visible.add(row.id);
      perJobCount.set(row.jobId, seen + 1);
    }
  }

  return visible;
}

/*
 * isApplicationVisibleOnFree
 * Returns true when the given application falls within a FREE recruiter's visible
 * 25-per-job window. Used by single-record routes (ai-summary, stage) to block
 * access to locked applicants even when the application id is known.
 * @param recruiterId - The recruiter (job owner) user id
 * @param applicationId - The application to check
 * @param jobId - The application's job id (scopes the per-job ranking)
 * @returns boolean
 */
export async function isApplicationVisibleOnFree(
  recruiterId: string,
  applicationId: string,
  jobId: string,
): Promise<boolean> {
  const visible = await getFreeVisibleApplicationIds(recruiterId, jobId);
  return visible.has(applicationId);
}
