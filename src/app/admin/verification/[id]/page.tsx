import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { AdminReviewPanel } from "@/modules/admin-verification/components/AdminReviewPanel";

export const revalidate = 0;

interface AdminVerificationDetailPageProps {
  params: { id: string };
}

interface ProjectSummary {
  name?: string;
  description?: string;
  url?: string;
}

function getProjectSummaries(value: unknown): ProjectSummary[] {
  if (!Array.isArray(value)) return [];

  return value.filter((project): project is ProjectSummary => {
    return typeof project === "object" && project !== null;
  });
}

function formatDate(value: Date | string | null): string {
  if (!value) return "Not provided";
  return format(new Date(value), "MMM d, yyyy");
}

/*
 * AdminVerificationDetailPage
 * Displays the full engineer profile and opens pending submissions for review.
 */
export default async function AdminVerificationDetailPage({
  params,
}: AdminVerificationDetailPageProps) {
  const engineer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      verificationStatus: true,
      hiretivoScore: true,
      reapplyAfter: true,
      profileSlug: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          primaryRole: true,
          location: true,
          yearsExperience: true,
          githubUsername: true,
          githubScore: true,
          githubAnalysis: true,
          videoIntroUrl: true,
          topProjects: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          skills: {
            select: {
              level: true,
              skill: { select: { name: true } },
            },
          },
          workExperiences: {
            orderBy: { startDate: "desc" },
            select: {
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
            },
          },
        },
      },
      verificationReviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          scoreGiven: true,
          notes: true,
          createdAt: true,
          reviewedBy: true,
        },
      },
    },
  });

  if (!engineer) notFound();

  const alreadyInReview =
    engineer.verificationStatus === VerificationStatus.IN_REVIEW;

  if (engineer.verificationStatus === VerificationStatus.PENDING) {
    await prisma.user.update({
      where: { id: params.id },
      data: { verificationStatus: VerificationStatus.IN_REVIEW },
    });
  }

  const projects = getProjectSummaries(engineer.seekerProfile?.topProjects);
  const canReview =
    engineer.verificationStatus === VerificationStatus.PENDING ||
    engineer.verificationStatus === VerificationStatus.IN_REVIEW;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <Link
          href="/admin/verification"
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          Back to queue
        </Link>
      </div>

      {alreadyInReview && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Another admin may already have this submission open.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-brand-foreground">
              {engineer.name ?? "Unnamed engineer"}
            </h1>
            <p className="mt-1 text-sm text-brand-foreground-muted">
              {engineer.email ?? "No email"}
            </p>
            {engineer.seekerProfile?.headline && (
              <p className="mt-3 text-base text-brand-foreground">
                {engineer.seekerProfile.headline}
              </p>
            )}
            {engineer.seekerProfile?.primaryRole && (
              <p className="mt-1 text-sm text-brand-foreground-muted">
                {engineer.seekerProfile.primaryRole}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-foreground-muted">
              {engineer.seekerProfile?.yearsExperience != null && (
                <span>{engineer.seekerProfile.yearsExperience}+ years</span>
              )}
              {engineer.timezoneOverlapHours != null && (
                <span>{engineer.timezoneOverlapHours}h timezone overlap</span>
              )}
              {engineer.availableFrom && (
                <span>Available {formatDate(engineer.availableFrom)}</span>
              )}
              {engineer.seekerProfile?.salaryMinUsd &&
                engineer.seekerProfile.salaryMaxUsd && (
                  <span>
                    ${Math.round(engineer.seekerProfile.salaryMinUsd / 1000)}k -
                    ${Math.round(engineer.seekerProfile.salaryMaxUsd / 1000)}k
                  </span>
                )}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
              {engineer.seekerProfile?.githubUsername && (
                <a
                  href={`https://github.com/${engineer.seekerProfile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-medium text-brand-primary hover:underline"
                >
                  GitHub profile
                </a>
              )}
              {engineer.seekerProfile?.videoIntroUrl && (
                <a
                  href={engineer.seekerProfile.videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-medium text-brand-primary hover:underline"
                >
                  Video intro
                </a>
              )}
              {engineer.profileSlug && (
                <Link
                  href={`/e/${engineer.profileSlug}`}
                  className="font-medium text-brand-primary hover:underline"
                >
                  Profile slug
                </Link>
              )}
            </div>
          </section>

          {engineer.seekerProfile?.bio && (
            <section className="rounded-xl border border-brand-border bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-brand-foreground">
                Bio
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-foreground-muted">
                {engineer.seekerProfile.bio}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-brand-foreground">
              Projects
            </h2>
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div
                    key={`${project.name ?? "project"}-${index}`}
                    className="border-b border-brand-border pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-brand-foreground">
                        {project.name ?? "Untitled project"}
                      </p>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-sm font-medium text-brand-primary hover:underline"
                        >
                          View project
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-1 text-sm text-brand-foreground-muted">
                        {project.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-foreground-muted">
                No projects submitted.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-brand-foreground">
              Skills
            </h2>
            {engineer.seekerProfile?.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {engineer.seekerProfile.skills.map((skill) => (
                  <span
                    key={`${skill.skill.name}-${skill.level}`}
                    className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground"
                  >
                    {skill.skill.name} - {skill.level}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-foreground-muted">
                No skills submitted.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-brand-foreground">
              Work History
            </h2>
            {engineer.seekerProfile?.workExperiences.length ? (
              <div className="space-y-3">
                {engineer.seekerProfile.workExperiences.map((work) => (
                  <div
                    key={`${work.company}-${work.title}-${work.startDate}`}
                    className="text-sm"
                  >
                    <p className="font-medium text-brand-foreground">
                      {work.title} at {work.company}
                    </p>
                    <p className="text-brand-foreground-muted">
                      {formatDate(work.startDate)} -{" "}
                      {work.isCurrent ? "Present" : formatDate(work.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-foreground-muted">
                No work history submitted.
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminReviewPanel
            engineerId={engineer.id}
            canReview={canReview}
            currentStatus={engineer.verificationStatus}
          />
        </aside>
      </div>
    </main>
  );
}
