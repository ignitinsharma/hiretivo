import { format } from "date-fns";
import Link from "next/link";

/*
 * SeekerProfileHero
 * Full-width profile header card with initials avatar, name, headline, stats bar,
 * GitHub/video links, and verification status badge.
 */

interface SeekerProfileHeroProps {
  name: string | null;
  email: string | null;
  headline: string | null;
  primaryRole: string | null;
  location: string | null;
  yearsExperience: number | null;
  timezoneOverlapHours: number | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  availableFrom: Date | string | null;
  githubUsername: string | null;
  videoIntroUrl: string | null;
  verificationStatus: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  IN_REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  VERIFIED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  NOT_SUBMITTED: "border-gray-200 bg-gray-50 text-gray-500",
};

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatSalary(min: number, max: number): string {
  return `$${Math.round(min / 1000)}k-$${Math.round(max / 1000)}k`;
}

function formatAvailabilityDate(date: Date | string | null): string {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy");
}

export function SeekerProfileHero({
  name,
  headline,
  primaryRole,
  location,
  yearsExperience,
  timezoneOverlapHours,
  salaryMinUsd,
  salaryMaxUsd,
  availableFrom,
  githubUsername,
  videoIntroUrl,
  verificationStatus,
}: SeekerProfileHeroProps) {
  const initials = getInitials(name);
  const statusStyle =
    STATUS_STYLES[verificationStatus] ?? STATUS_STYLES.NOT_SUBMITTED;
  const hasLinks = githubUsername || videoIntroUrl;
  const hasStats =
    yearsExperience != null ||
    timezoneOverlapHours != null ||
    (salaryMinUsd != null && salaryMaxUsd != null) ||
    availableFrom;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Initials avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white sm:h-20 sm:w-20 sm:text-xl">
          {initials}
        </div>

        {/* Info area */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl leading-snug tracking-tight text-brand-foreground sm:text-3xl">
                {name ?? "Unnamed engineer"}
              </h1>
              {headline && (
                <p className="mt-0.5 text-base text-brand-foreground-muted">
                  {headline}
                </p>
              )}
              {(primaryRole || location) && (
                <p className="mt-0.5 text-sm text-brand-foreground-secondary">
                  {[primaryRole, location].filter(Boolean).join(" \u00b7 ")}
                </p>
              )}
            </div>
            <span
              className={`mt-2 inline-flex self-start rounded-full border px-3 py-1 text-xs font-medium sm:mt-0 ${statusStyle}`}
            >
              {verificationStatus}
            </span>
          </div>

          {/* Stats bar */}
          {hasStats && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {yearsExperience != null && (
                <span className="font-medium text-brand-foreground">
                  {yearsExperience}+ yrs exp
                </span>
              )}
              {timezoneOverlapHours != null && (
                <span className="text-brand-foreground-muted">
                  {timezoneOverlapHours}h overlap
                </span>
              )}
              {salaryMinUsd != null && salaryMaxUsd != null && (
                <span className="text-brand-foreground-muted">
                  {formatSalary(salaryMinUsd, salaryMaxUsd)}
                </span>
              )}
              {availableFrom && (
                <span className="text-brand-foreground-muted">
                  Available {formatAvailabilityDate(availableFrom)}
                </span>
              )}
            </div>
          )}

          {/* Links */}
          {hasLinks && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {githubUsername && (
                <Link
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-medium text-brand-primary hover:underline"
                >
                  github/{githubUsername}
                </Link>
              )}
              {videoIntroUrl && (
                <Link
                  href={videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-medium text-brand-primary hover:underline"
                >
                  Video intro
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
