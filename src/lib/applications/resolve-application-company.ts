import { resolveLogoUrl } from "@/lib/r2";

export interface ApplicationCompanySource {
  externalCompanyName: string | null;
  job: {
    isAdminPosted: boolean;
    companyName: string | null;
    companyLogoUrl: string | null;
    recruiter: { recruiterProfile: { companyName: string | null; logo: string | null } | null } | null;
  } | null;
}

/*
 * resolveApplicationCompany
 * FEED applications resolve company via the joined Job (admin-posted uses
 * Job's own company* fields; recruiter-posted uses RecruiterProfile).
 * PASTED_LINK/MANUAL applications have no Job row — use the Application's
 * own external* snapshot (add-link time, or manual-entry input).
 * Shared by GET /api/seeker/applications and GET /api/seeker/tracker/export.
 */
export function resolveApplicationCompany(app: ApplicationCompanySource): {
  companyName: string;
  companyLogoUrl: string | null;
} {
  if (!app.job) {
    return { companyName: app.externalCompanyName ?? "Unknown company", companyLogoUrl: null };
  }
  if (app.job.isAdminPosted) {
    return {
      companyName: app.job.companyName ?? "Unknown company",
      companyLogoUrl: app.job.companyLogoUrl ?? null,
    };
  }
  return {
    companyName: app.job.recruiter?.recruiterProfile?.companyName ?? "Unknown company",
    companyLogoUrl: resolveLogoUrl(app.job.recruiter?.recruiterProfile?.logo ?? null),
  };
}
