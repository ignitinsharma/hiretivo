import { ApplicationStatus, ApplySource } from "@/constants/enums";
import { prisma } from "@/lib/prisma";

/*
 * isPrismaUniqueConstraintError
 * Detects a Prisma unique-constraint violation (P2002) without `any`.
 * (Same small check duplicated per-route elsewhere in this codebase —
 * matching existing convention rather than introducing a new shared util.)
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export interface ManualApplicationInput {
  companyName: string;
  jobTitle: string;
  status?: ApplicationStatus;
  appliedAt?: Date;
  notes?: string;
  externalJobUrl?: string;
}

export interface ExistingApplicationDedupKeys {
  companyRoleKeys: Set<string>;
  externalJobUrls: Set<string>;
}

/*
 * loadExistingApplicationDedupKeys
 * Builds the (companyName+jobTitle) and externalJobUrl sets used to dedup
 * manual/CSV-import rows against a seeker's EXISTING applications (of any
 * source — a manual row must not duplicate an existing FEED application
 * either). Company name resolution mirrors resolveApplicationCompany in
 * GET /api/seeker/applications.
 */
export async function loadExistingApplicationDedupKeys(seekerId: string): Promise<ExistingApplicationDedupKeys> {
  const rows = await prisma.application.findMany({
    where: { seekerId },
    select: {
      externalJobUrl: true,
      externalCompanyName: true,
      externalTitle: true,
      job: {
        select: {
          title: true,
          isAdminPosted: true,
          companyName: true,
          recruiter: { select: { recruiterProfile: { select: { companyName: true } } } },
        },
      },
    },
  });

  const companyRoleKeys = new Set<string>();
  const externalJobUrls = new Set<string>();
  for (const row of rows) {
    const companyName = row.job
      ? ((row.job.isAdminPosted ? row.job.companyName : row.job.recruiter?.recruiterProfile?.companyName) ??
        "Unknown company")
      : (row.externalCompanyName ?? "Unknown company");
    const jobTitle = row.job?.title ?? row.externalTitle ?? "";
    companyRoleKeys.add(`${companyName.trim().toLowerCase()}::${jobTitle.trim().toLowerCase()}`);
    if (row.externalJobUrl) externalJobUrls.add(row.externalJobUrl);
  }
  return { companyRoleKeys, externalJobUrls };
}

export type CreateManualApplicationResult = { outcome: "created"; id: string } | { outcome: "duplicate" };

/*
 * createManualApplication
 * Inserts one ApplySource.MANUAL Application row (Add-application modal
 * single entry, or one CSV-import row — Section F3). No jobId, no AI
 * artifacts ever; company/role live on the external* fields exactly like a
 * PASTED_LINK row. Dedups against `existing` by company+role (case
 * insensitive) OR externalJobUrl per the plan's spec, mutating `existing` in
 * place on success so a caller inserting many rows in a loop (CSV import)
 * doesn't create duplicates against rows it just inserted itself.
 */
export async function createManualApplication(
  seekerId: string,
  input: ManualApplicationInput,
  existing: ExistingApplicationDedupKeys,
): Promise<CreateManualApplicationResult> {
  const companyRoleKey = `${input.companyName.trim().toLowerCase()}::${input.jobTitle.trim().toLowerCase()}`;
  if (existing.companyRoleKeys.has(companyRoleKey)) return { outcome: "duplicate" };
  if (input.externalJobUrl && existing.externalJobUrls.has(input.externalJobUrl)) {
    return { outcome: "duplicate" };
  }

  try {
    const application = await prisma.application.create({
      data: {
        seekerId,
        source: ApplySource.MANUAL,
        status: input.status ?? ApplicationStatus.APPLIED,
        matchScore: 0,
        externalCompanyName: input.companyName.trim(),
        externalTitle: input.jobTitle.trim(),
        externalJobUrl: input.externalJobUrl ?? null,
        notes: input.notes ?? null,
        ...(input.appliedAt ? { createdAt: input.appliedAt } : {}),
      },
      select: { id: true },
    });
    existing.companyRoleKeys.add(companyRoleKey);
    if (input.externalJobUrl) existing.externalJobUrls.add(input.externalJobUrl);
    return { outcome: "created", id: application.id };
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) return { outcome: "duplicate" };
    throw error;
  }
}
