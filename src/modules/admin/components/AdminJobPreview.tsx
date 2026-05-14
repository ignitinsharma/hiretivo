"use client";

import { useQuery } from "@tanstack/react-query";
import { skillService } from "@/services/skill.service";
import { JobCard } from "@/components/shared/JobCard";
import { LogoPreview } from "./LogoPreview";
import { CurrencyCode } from "@/constants/enums";
import type { JobListItem } from "@/modules/jobs/types/job.types";
import type { AdminJobFormValues } from "../types/admin-job.types";

interface Props {
  values: AdminJobFormValues;
}

/*
 * formatSalaryRange
 * Converts raw min/max salary strings and a currency code into a human-readable
 * range label like "$80k – $120k". Returns "Not specified" if both values are
 * absent or zero.
 */
function formatSalaryRange(min: string, max: string, currency: string): string {
  const cur = currency || CurrencyCode.USD;
  const symbol =
    cur === CurrencyCode.USD
      ? "$"
      : cur === CurrencyCode.GBP
        ? "£"
        : cur === CurrencyCode.EUR
          ? "€"
          : "";
  const m = parseInt(min || "0", 10);
  const x = parseInt(max || "0", 10);
  if (!m && !x) return "Not specified";
  const minStr = m ? `${symbol}${Math.round(m / 1000)}k` : "";
  const maxStr = x ? `${symbol}${Math.round(x / 1000)}k` : "";
  if (m && x) return `${minStr} – ${maxStr}`;
  return minStr || maxStr;
}

/*
 * AdminJobPreview
 * Live preview of the admin job form values, mirroring the public seeker-facing display.
 * Renders a JobCard (the card seekers see in the feed) plus a condensed detail card
 * showing the company header, selected skills, and the formatted job description.
 * Sticky-positioned so it stays in view while the admin scrolls through the form.
 */
export function AdminJobPreview({ values }: Props) {
  const { data: skills } = useQuery({
    queryKey: ["skills-all"],
    queryFn: skillService.getSkills,
    staleTime: 5 * 60 * 1000,
  });

  const selectedSkillNames = (skills ?? [])
    .filter((s) => values.selectedSkillIds?.includes(s.id))
    .map((s) => s.name);

  /* Build a JobListItem from live form values so JobCard renders a real preview. */
  const jobItem: JobListItem = {
    id: "preview",
    title: values.title || "Job title",
    companyName: values.companyName || "Company",
    companyLogoUrl: values.companyLogoUrl || undefined,
    location: values.workType || "Remote",
    salaryRange: formatSalaryRange(values.salaryMin, values.salaryMax, values.currency),
    tags: selectedSkillNames.slice(0, 3),
    postedAt: "Just now",
    jobType: values.jobType || undefined,
    workType: values.workType || null,
    experienceLevel: values.experienceLevel || null,
    companyIndustry: values.companyIndustry || null,
    companySize: values.companySize || null,
    companyFundingType: values.companyFunding || null,
    applyType: "EXTERNAL",
    externalApplyUrl: values.externalApplyUrl || null,
  };

  return (
    <div className="sticky top-4 space-y-4">
      <div className="text-sm font-medium text-brand-foreground-muted">Preview</div>

      {/* Seeker-facing job card */}
      <JobCard job={jobItem} isPreview />

      {/* Condensed detail card */}
      <div className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
        {/* Company header */}
        <div className="flex items-center gap-3">
          <LogoPreview
            url={values.companyLogoUrl || ""}
            companyName={values.companyName || "?"}
            size={56}
          />
          <div>
            <div className="font-semibold text-lg text-brand-foreground">
              {values.companyName || "Company"}
            </div>
            <div className="text-sm text-brand-foreground-muted">
              {[values.companyIndustry, values.companySize].filter(Boolean).join(" · ") ||
                "Industry · Size"}
            </div>
          </div>
        </div>

        {/* Job title */}
        <h2 className="font-bold text-2xl text-brand-foreground">
          {values.title || "Job title"}
        </h2>

        {/* Selected skills */}
        {selectedSkillNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkillNames.map((s) => (
              <span
                key={s}
                className="px-2 py-1 rounded-md bg-brand-surface text-brand-foreground text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Rich-text description preview */}
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html:
              values.description ||
              "<p class='text-brand-foreground-muted'>Description preview…</p>",
          }}
        />
      </div>
    </div>
  );
}
