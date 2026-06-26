/*
 * Centralized resolver for a job's displayed company info.
 * Admin-posted jobs may carry per-job overrides (companyName, companyLogoUrl, etc.)
 * For non-admin jobs, falls back to the recruiter profile.
 * Returns a flat shape that mirrors the public JobListItem fields.
 */

export interface JobCompanyInput {
  companyName: string | null;
  companyLogoUrl: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyFunding: string | null;
  companyWebsite?: string | null;
  recruiter: {
    recruiterProfile: {
      id: string;
      companyName: string;
      logo: string | null;
      companySize?: string | null;
      industry?: string | null;
      fundingType?: string | null;
    } | null;
  };
}

export interface ResolvedCompany {
  companyId: string | null;
  companyName: string;
  /** Direct external URL when admin set it; null otherwise. */
  companyLogoUrl: string | null;
  /** Raw recruiter profile logo (R2 key or full URL) when admin URL is null. Caller passes through resolveLogoUrl(). */
  rawRecruiterLogo: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyFundingType: string | null;
}

/*
 * resolveJobCompany
 * Resolves the displayed company information for a job listing.
 * Admin-posted jobs use per-job overrides; regular recruiter jobs fall
 * back to the recruiter's profile. When neither provides a company name,
 * returns "Unknown".
 * @param job - JobCompanyInput with optional admin overrides and recruiter profile
 * @returns ResolvedCompany flat shape ready for display/serialization
 */
export function resolveJobCompany(job: JobCompanyInput): ResolvedCompany {
  const profile = job.recruiter.recruiterProfile;
  const hasAdminName = Boolean(job.companyName);

  return {
    companyId: hasAdminName ? null : (profile?.id ?? null),
    companyName: job.companyName ?? profile?.companyName ?? "Unknown",
    companyLogoUrl: job.companyLogoUrl ?? null,
    rawRecruiterLogo: job.companyLogoUrl ? null : (profile?.logo ?? null),
    companySize: job.companySize ?? profile?.companySize ?? null,
    companyIndustry: job.companyIndustry ?? profile?.industry ?? null,
    companyFundingType: job.companyFunding ?? profile?.fundingType ?? null,
  };
}

/** 
 * Resolves a company logo URL with multi-tier fallback:
 * 1. Direct URL from DB (admin override or recruiter profile)
 * 2. Google faviconV2 from company website (free, no key)
 * 3. null — frontend should show initials placeholder
 */
export function resolveCompanyLogoUrl(
  directUrl: string | null,
  companyWebsite: string | null,
): string | null {
  if (directUrl) return directUrl;

  if (companyWebsite) {
    try {
      const url = new URL(companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`);
      const domain = url.hostname.replace(/^www\./, '');
      return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;
    } catch {
      // Invalid URL — fall through
    }
  }

  return null;
}
