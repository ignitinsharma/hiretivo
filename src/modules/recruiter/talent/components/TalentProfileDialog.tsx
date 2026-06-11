"use client";

import type { ReactElement } from "react";
import {
  BriefcaseBusiness,
  Check,
  Copy,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  Quote,
} from "lucide-react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { HiretivoVerifiedBadge } from "@/components/shared/HiretivoVerifiedBadge";
import { ProfileLinks } from "@/components/shared/ProfileLinks";
import { ProfileLinkVariant, VerificationStatus } from "@/constants/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFetchTalentDetail } from "@/modules/recruiter/talent/queries/use-fetch-talent";
import { formatProfileLabel } from "@/modules/recruiter/talent/utils/format-profile-label";
import type {
  TalentDetail,
  TalentEducation,
  TalentProject,
  TalentSkill,
  TalentWorkExperience,
} from "@/modules/recruiter/talent/types/talent.types";

interface TalentProfileDialogProps {
  seekerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OpportunityChip {
  label: string;
  tone: "primary" | "neutral";
}

const SECTION_LABEL_CLASS = "text-sm font-medium text-brand-foreground-muted";
const BODY_TEXT_CLASS =
  "text-[15px] leading-relaxed text-brand-foreground-muted";
const MAX_VISIBLE_EXPERIENCE = 2;
const MAX_VISIBLE_SKILLS = 12;

/**
 * Formats availability or notice period values for display.
 */
function formatAvailability(value: string | null): string {
  if (!value) {
    return "Availability not specified";
  }

  return formatProfileLabel(value);
}

/**
 * Formats the seeker experience value for compact display.
 */
function formatExperience(yearsExperience: number | null): string {
  if (yearsExperience === null) {
    return "Experience not specified";
  }

  if (yearsExperience === 0) {
    return "< 1 year of exp";
  }

  return `${yearsExperience} ${yearsExperience === 1 ? "year" : "years"} of exp`;
}

/**
 * Formats salary preference when either bound exists.
 */
function formatSalaryRange(talent: TalentDetail): string | null {
  const { salaryMin, salaryMax, currency } = talent.profile;
  if (salaryMin === null && salaryMax === null) {
    return null;
  }

  const currencyLabel = currency ?? "USD";
  const formattedMin =
    salaryMin !== null
      ? `${currencyLabel} ${salaryMin.toLocaleString()}`
      : null;
  const formattedMax =
    salaryMax !== null
      ? `${currencyLabel} ${salaryMax.toLocaleString()}`
      : null;

  if (formattedMin && formattedMax) {
    return `${formattedMin} / ${formattedMax}`;
  }

  return formattedMin ? `From ${formattedMin}` : `Up to ${formattedMax}`;
}

/**
 * Formats freeform month/year dates stored on profile entries.
 */
function formatDateRange(
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
): string {
  return `${startDate} to ${isCurrent ? "Present" : (endDate ?? "Present")}`;
}

/**
 * Builds the profile metadata sentence under the candidate name.
 */
function getProfileMeta(talent: TalentDetail): string {
  return [
    formatExperience(talent.yearsExperience),
    talent.location ?? "Location not provided",
    formatProfileLabel(talent.profile.workPreference),
  ].join(" • ");
}

/**
 * Builds compact candidate preference chips.
 */
function getOpportunityChips(talent: TalentDetail): OpportunityChip[] {
  const salary = formatSalaryRange(talent);

  return [
    {
      label: formatProfileLabel(talent.profile.workPreference),
      tone: "primary",
    },
    { label: talent.location ?? "Location not provided", tone: "primary" },
    { label: talent.primaryRole ?? "Role open", tone: "primary" },
  ];
}

/**
 * Skeleton that preserves the final profile layout while data loads.
 */
function TalentProfileSkeleton(): ReactElement {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}

/**
 * Renders the reference-style candidate identity header.
 */
function TalentProfileHeader({
  talent,
}: {
  talent: TalentDetail;
}): ReactElement {
  const statusLabel = formatAvailability(talent.availability);

  return (
    <DialogHeader className="shrink-0 border-b border-brand-border px-6 py-5 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <InitialsAvatar
            name={talent.name}
            email={talent.email}
            userId={talent.id}
            image={talent.image}
            size="lg"
            verified={talent.verificationStatus === VerificationStatus.VERIFIED}
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <DialogTitle className="truncate text-2xl font-bold capitalize leading-tight tracking-tight text-brand-foreground">
                {talent.name ?? "Unnamed talent"}
              </DialogTitle>
              <HiretivoVerifiedBadge variant="inline" />
            </div>
            <DialogDescription className="mt-1 text-base font-medium leading-relaxed text-brand-foreground-muted">
              {getProfileMeta(talent)}
            </DialogDescription>
            <p className="mt-1 text-sm font-medium text-brand-foreground-muted">
              {formatProfileLabel(talent.profile.situation)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground">
                {statusLabel}
              </span>
              <ProfileLinks
                variant={ProfileLinkVariant.BORDERED}
                email={talent.email}
                resumeUrl={talent.resumeUrl}
                websiteUrl={talent.links?.websiteUrl}
                linkedinUrl={talent.links?.linkedinUrl}
                githubUrl={talent.links?.githubUrl}
                twitterUrl={talent.links?.twitterUrl}
                videoIntroUrl={talent.videoIntroUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </DialogHeader>
  );
}

/**
 * Renders the candidate bio as a quote-style intent block.
 */
function LookingForSection({ bio }: { bio: string | null }): ReactElement {
  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>Looking for</p>
      <div className="mt-3 flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand-foreground-secondary">
          <Quote className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <p className="max-w-3xl text-base leading-relaxed text-brand-foreground">
          {bio?.trim() || "This candidate has not added a bio yet."}
        </p>
      </div>
    </section>
  );
}

/**
 * Renders safe profile summary fields available in locked and unlocked states.
 */
function ProfileSummarySection({
  talent,
}: {
  talent: TalentDetail;
}): ReactElement {
  const summaryItems = [
    {
      label: "Professional Headline",
      value: talent.headline ?? "Not specified",
    },
    {
      label: "Primary Role",
      value: talent.primaryRole ?? "Not specified",
    },
    {
      label: "Job Search Status",
      value: formatProfileLabel(talent.profile.situation),
    },
    {
      label: "Availability",
      value: formatAvailability(talent.availability),
    },
    {
      label: "Location",
      value: talent.location ?? "Location not provided",
    },
    {
      label: "Years Experience",
      value: formatExperience(talent.yearsExperience),
    },
    {
      label: "Salary",
      value: formatSalaryRange(talent) ?? "Not specified",
    },
    {
      label: "Work Preference",
      value: formatProfileLabel(talent.profile.workPreference),
    },
  ];

  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>Profile summary</p>
      <dl className="mt-3 grid grid-cols-1 overflow-hidden rounded-xl border border-brand-border bg-white sm:grid-cols-2">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="border-b border-brand-border p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <dt className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold leading-relaxed text-brand-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Renders one compact work experience row.
 */
function ExperienceRow({
  experience,
}: {
  experience: TalentWorkExperience;
}): ReactElement {
  return (
    <article className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-foreground-muted">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className="capitalize text-sm font-bold text-brand-foreground">
          {experience.title}
        </h3>
        <p className="mt-0.5 text-sm font-medium capitalize text-brand-foreground-muted">
          {experience.company}
        </p>
        <p className="mt-1 text-sm text-brand-foreground-muted">
          {formatDateRange(
            experience.startDate,
            experience.endDate,
            experience.isCurrent,
          )}
        </p>
        {experience.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-foreground-muted">
            {experience.description}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Renders the profile work history in a compact list.
 */
function ExperienceSection({
  workExperiences,
}: {
  workExperiences: TalentWorkExperience[];
}): ReactElement {
  const visibleExperiences = workExperiences.slice(0, MAX_VISIBLE_EXPERIENCE);
  const hiddenCount = Math.max(
    workExperiences.length - MAX_VISIBLE_EXPERIENCE,
    0,
  );

  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>
        Experience{" "}
        {hiddenCount > 0 && (
          <span className="text-brand-primary">- {hiddenCount} more</span>
        )}
      </p>
      {visibleExperiences.length > 0 ? (
        <div className="mt-3 space-y-4">
          {visibleExperiences.map((experience) => (
            <ExperienceRow key={experience.id} experience={experience} />
          ))}
        </div>
      ) : (
        <p className={cn("mt-3", BODY_TEXT_CLASS)}>No work experience added.</p>
      )}
    </section>
  );
}

/**
 * Renders education in one line per record.
 */
function EducationRow({
  education,
}: {
  education: TalentEducation;
}): ReactElement {
  const program = [education.degree, education.major]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-foreground-muted">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-brand-foreground">
          {program || education.institution}
        </h3>
        {program ? (
          <p className="mt-0.5 text-sm font-medium text-brand-foreground-muted">
            {education.institution}
          </p>
        ) : null}
        {education.graduationDate ? (
          <p className="mt-1 text-sm text-brand-foreground-muted">
            {education.graduationDate}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function EducationSection({
  educations,
}: {
  educations: TalentEducation[];
}): ReactElement {
  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>Education</p>
      {educations.length > 0 ? (
        <div className="mt-3 space-y-4">
          {educations.map((education) => (
            <EducationRow key={education.id} education={education} />
          ))}
        </div>
      ) : (
        <p className={cn("mt-3", BODY_TEXT_CLASS)}>No education added.</p>
      )}
    </section>
  );
}

/**
 * Renders proof-of-work profile details that are visible after unlock.
 */
function ProofOfWorkSection({
  projects,
  videoIntroUrl,
  githubUsername,
}: {
  projects: TalentProject[];
  videoIntroUrl: string | null;
  githubUsername: string | null;
}): ReactElement {
  if (projects.length === 0 && !videoIntroUrl && !githubUsername) {
    return (
      <section>
        <p className={SECTION_LABEL_CLASS}>Proof of work</p>
        <p className={cn("mt-3", BODY_TEXT_CLASS)}>
          No proof-of-work links added.
        </p>
      </section>
    );
  }

  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>Proof of work</p>
      <div className="mt-3 space-y-3">
        {githubUsername ? (
          <p className={BODY_TEXT_CLASS}>GitHub username: {githubUsername}</p>
        ) : null}
        {videoIntroUrl ? (
          <a
            href={videoIntroUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
          >
            Video intro
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
        {projects.map((project, index) => (
          <article
            key={`${project.title ?? "project"}-${index}`}
            className="rounded-xl border border-brand-border bg-brand-surface p-4"
          >
            <h3 className="text-sm font-bold text-brand-foreground">
              {project.title ?? "Untitled project"}
            </h3>
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                {project.url}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
            {project.description ? (
              <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                {project.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Renders a flat skills list with overflow count.
 */
function SkillsSection({ skills }: { skills: TalentSkill[] }): ReactElement {
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
  const hiddenCount = Math.max(skills.length - MAX_VISIBLE_SKILLS, 0);

  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>Skills</p>
      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <span
              key={`${skill.name}-${skill.level}`}
              className="rounded-lg bg-brand-surface px-3 py-2 text-xs font-medium text-brand-foreground"
            >
              {skill.name}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-primary">
              {hiddenCount} more
            </span>
          )}
        </div>
      ) : (
        <p className={cn("mt-3", BODY_TEXT_CLASS)}>No skills provided.</p>
      )}
    </section>
  );
}

/**
 * Renders ideal next opportunity chips from existing profile fields.
 */
function IdealOpportunitySection({
  talent,
}: {
  talent: TalentDetail;
}): ReactElement {
  const chips = getOpportunityChips(talent);

  return (
    <section>
      <p className={SECTION_LABEL_CLASS}>Ideal next opportunity</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={`${chip.label}-${chip.tone}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium",
              chip.tone === "primary"
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-brand-surface text-brand-foreground",
            )}
          >
            {chip.tone === "primary" && (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {chip.label}
          </span>
        ))}
      </div>
    </section>
  );
}

/**
 * Renders the full expanded candidate profile for Talent Pool discovery.
 */
function TalentProfileContent({
  talent,
}: {
  talent: TalentDetail;
}): ReactElement {
  const hasFooterActions = Boolean(talent.resumeUrl || talent.email);
  const copyEmail = async () => {
    if (!talent.email) return;
    try {
      await navigator.clipboard.writeText(talent.email);
      toast.success("Email copied.");
    } catch {
      toast.error("Could not copy email.");
    }
  };

  return (
    <>
      <TalentProfileHeader talent={talent} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-7">
          <ProfileSummarySection talent={talent} />
          {talent.isUnlocked ? (
            <>
              <LookingForSection bio={talent.bio} />
              <ProofOfWorkSection
                projects={talent.topProjects}
                videoIntroUrl={talent.videoIntroUrl}
                githubUsername={talent.githubUsername}
              />
              <ExperienceSection workExperiences={talent.workExperiences} />
              <EducationSection educations={talent.educations} />
            </>
          ) : null}
          <SkillsSection skills={talent.skills} />
          {talent.isUnlocked ? (
            <IdealOpportunitySection talent={talent} />
          ) : null}
        </div>
      </div>
      {hasFooterActions ? (
        <div className="shrink-0 border-t border-brand-border px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {talent.resumeUrl && (
                <Button asChild variant="default" className="w-full sm:w-auto">
                  <a href={talent.resumeUrl} target="_blank" rel="noreferrer">
                    <FileText className="h-4 w-4" />
                    Resume
                  </a>
                </Button>
              )}
              {talent.email && (
                <>
                  <Button
                    type="button"
                    variant="default"
                    className="w-full sm:w-auto"
                    onClick={copyEmail}
                  >
                    <Copy className="h-4 w-4" />
                    Copy email
                  </Button>
                  <Button
                    asChild
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    <a href={`mailto:${talent.email}`}>
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Dialog opened from Talent Pool candidate cards.
 */
export function TalentProfileDialog({
  seekerId,
  open,
  onOpenChange,
}: TalentProfileDialogProps): ReactElement {
  const {
    data: talent,
    isError,
    isLoading,
  } = useFetchTalentDetail(open ? seekerId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl border-brand-border p-0 sm:max-w-3xl">
        {isLoading ? (
          <div className="min-h-0 overflow-y-auto">
            <TalentProfileSkeleton />
          </div>
        ) : talent ? (
          <TalentProfileContent talent={talent} />
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-brand-foreground">
              {isError ? "Profile could not be loaded." : "Profile not found."}
            </p>
            <p className="mt-2 text-sm text-brand-foreground-muted">
              Close this dialog and try opening the candidate again.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
