/*
 * Centralized resolver for a job's displayed company info.
 * Company info comes directly from the Job model (populated from ATS feed or admin post).
 */

export interface JobCompanyInput {
  companyName: string | null;
  companyLogoUrl: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyFunding: string | null;
  companyWebsite?: string | null;
}

export interface ResolvedCompany {
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyFundingType: string | null;
}

export function resolveJobCompany(job: JobCompanyInput): ResolvedCompany {
  const name = job.companyName ?? "Unknown";
  return {
    companyId: name,
    companyName: name,
    companyLogoUrl: job.companyLogoUrl ?? null,
    companySize: job.companySize ?? null,
    companyIndustry: job.companyIndustry ?? null,
    companyFundingType: job.companyFunding ?? null,
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
