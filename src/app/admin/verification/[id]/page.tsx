import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { VerificationReviewForm } from "@/modules/admin/components/VerificationReviewForm";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";

const STATUS_LABELS: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  PENDING: "Pending review",
  IN_REVIEW: "In review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

/*
 * /admin/verification/[id]
 * Server component. Loads full engineer profile from the database for review.
 * Left column: profile details (GitHub, LinkedIn, projects, experience, education, skills).
 * Right column: VerificationReviewForm (client) for approve/reject decision.
 * Layout auth guard is handled by the parent /admin/layout.tsx.
 */
export default async function AdminVerificationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      verificationStatus: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          headline: true,
          bio: true,
          location: true,
          yearsExperience: true,
          workPreference: true,
          githubUrl: true,
          githubUsername: true,
          linkedinUrl: true,
          twitterUrl: true,
          websiteUrl: true,
          videoIntroUrl: true,
          topProjects: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          currency: true,
          availability: true,
          resumeKey: true,
          verificationNotes: true,
          submittedForReviewAt: true,
          skills: {
            select: {
              level: true,
              skill: { select: { name: true } },
            },
          },
          workExperiences: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
              positionType: true,
              skills: true,
            },
          },
          educations: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              institution: true,
              degree: true,
              major: true,
              graduationDate: true,
            },
          },
        },
      },
    },
  });

  if (!user) notFound();

  const profile = user.seekerProfile;
  const submittedAt = profile?.submittedForReviewAt;

  // Parse topProjects — stored as Json, expected shape: { title, url, description }[]
  type TopProject = { title?: string; url?: string; description?: string };
  const topProjects: TopProject[] = Array.isArray(profile?.topProjects)
    ? (profile.topProjects as TopProject[])
    : [];

  const statusLabel = STATUS_LABELS[user.verificationStatus] ?? user.verificationStatus;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <InitialsAvatar
            name={user.name}
            email={user.email}
            userId={user.id}
            image={user.image}
            size="lg"
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/verification"
                className="text-sm text-brand-foreground-muted hover:text-brand-foreground"
              >
                ← Verification queue
              </Link>
            </div>
            <h1 className="font-bold text-2xl text-brand-foreground">
              {user.name ?? "Unnamed engineer"}
            </h1>
            <p className="text-sm text-brand-foreground-muted">{user.email ?? "No email"}</p>
            {submittedAt && (
              <p className="text-xs text-brand-foreground-secondary mt-1">
                Submitted {format(new Date(submittedAt), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
        <span className="inline-flex items-center self-start rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          {statusLabel}
        </span>
      </div>

      {/* Two-column layout: profile left, review form right */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left: profile details */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Basic info */}
          <section className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
            <h2 className="font-semibold text-base text-brand-foreground">Profile</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-brand-foreground-muted font-medium">Role</dt>
                <dd className="text-brand-foreground">{profile?.primaryRole ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted font-medium">Headline</dt>
                <dd className="text-brand-foreground">{profile?.headline ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted font-medium">Location</dt>
                <dd className="text-brand-foreground">{profile?.location ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted font-medium">Availability</dt>
                <dd className="text-brand-foreground">{profile?.availability ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted font-medium">Years experience</dt>
                <dd className="text-brand-foreground">
                  {profile?.yearsExperience != null ? profile.yearsExperience : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-brand-foreground-muted font-medium">Work preference</dt>
                <dd className="text-brand-foreground">{profile?.workPreference ?? "—"}</dd>
              </div>
              {profile?.salaryMinUsd != null && (
                <div>
                  <dt className="text-brand-foreground-muted font-medium">Salary (USD)</dt>
                  <dd className="text-brand-foreground">
                    ${profile.salaryMinUsd.toLocaleString()} – $
                    {(profile.salaryMaxUsd ?? profile.salaryMinUsd).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
            {profile?.bio && (
              <div className="pt-2 border-t border-brand-border">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted mb-1">Bio</p>
                <p className="text-sm text-brand-foreground leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}
          </section>

          {/* Links */}
          <section className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
            <h2 className="font-semibold text-base text-brand-foreground">Links</h2>
            <ul className="space-y-2 text-sm">
              {profile?.githubUrl && (
                <li>
                  <span className="text-brand-foreground-muted mr-2">GitHub</span>
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline break-all"
                  >
                    {profile.githubUrl}
                  </a>
                </li>
              )}
              {profile?.linkedinUrl && (
                <li>
                  <span className="text-brand-foreground-muted mr-2">LinkedIn</span>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline break-all"
                  >
                    {profile.linkedinUrl}
                  </a>
                </li>
              )}
              {profile?.websiteUrl && (
                <li>
                  <span className="text-brand-foreground-muted mr-2">Portfolio</span>
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline break-all"
                  >
                    {profile.websiteUrl}
                  </a>
                </li>
              )}
              {profile?.twitterUrl && (
                <li>
                  <span className="text-brand-foreground-muted mr-2">Twitter/X</span>
                  <a
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline break-all"
                  >
                    {profile.twitterUrl}
                  </a>
                </li>
              )}
              {profile?.videoIntroUrl && (
                <li>
                  <span className="text-brand-foreground-muted mr-2">Video intro</span>
                  <a
                    href={profile.videoIntroUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline break-all"
                  >
                    {profile.videoIntroUrl}
                  </a>
                </li>
              )}
              <li>
                <span className="text-brand-foreground-muted mr-2">Resume</span>
                {profile?.resumeKey ? (
                  <a
                    href={`/api/admin/verification/${user.id}/resume`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-brand-border bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-primary hover:bg-white"
                  >
                    Open resume
                  </a>
                ) : (
                  <span className="text-brand-foreground-secondary">Not uploaded</span>
                )}
              </li>
            </ul>
          </section>

          {/* Top projects */}
          {topProjects.length > 0 && (
            <section className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
              <h2 className="font-semibold text-base text-brand-foreground">Projects</h2>
              <ul className="space-y-4">
                {topProjects.map((p, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-brand-foreground">{p.title ?? "Untitled"}</span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary hover:underline text-xs"
                        >
                          {p.url}
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-brand-foreground-muted leading-relaxed">{p.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {(profile?.skills?.length ?? 0) > 0 && (
            <section className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
              <h2 className="font-semibold text-base text-brand-foreground">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile!.skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground"
                  >
                    {s.skill.name}
                    <span className="ml-1 text-brand-foreground-muted font-normal">· {s.level.toLowerCase()}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Work experience */}
          {(profile?.workExperiences?.length ?? 0) > 0 && (
            <section className="rounded-xl border border-brand-border bg-white p-5 space-y-4">
              <h2 className="font-semibold text-base text-brand-foreground">Work experience</h2>
              {profile!.workExperiences.map((w) => (
                <div key={w.id} className="border-t border-brand-border pt-4 first:border-none first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <div>
                      <span className="font-medium text-sm text-brand-foreground">{w.title}</span>
                      <span className="text-brand-foreground-muted text-sm"> at {w.company}</span>
                    </div>
                    <span className="text-xs text-brand-foreground-secondary whitespace-nowrap">
                      {w.startDate} – {w.isCurrent ? "Present" : (w.endDate ?? "—")}
                    </span>
                  </div>
                  {w.description && (
                    <p className="text-sm text-brand-foreground-muted leading-relaxed whitespace-pre-line mt-1">
                      {w.description}
                    </p>
                  )}
                  {w.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {w.skills.map((sk, i) => (
                        <span key={i} className="rounded border border-brand-border px-1.5 py-0.5 text-xs text-brand-foreground-muted">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Education */}
          {(profile?.educations?.length ?? 0) > 0 && (
            <section className="rounded-xl border border-brand-border bg-white p-5 space-y-4">
              <h2 className="font-semibold text-base text-brand-foreground">Education</h2>
              {profile!.educations.map((e) => (
                <div key={e.id} className="border-t border-brand-border pt-4 first:border-none first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <span className="font-medium text-sm text-brand-foreground">{e.institution}</span>
                      {(e.degree || e.major) && (
                        <p className="text-sm text-brand-foreground-muted">
                          {[e.degree, e.major].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    {e.graduationDate && (
                      <span className="text-xs text-brand-foreground-secondary whitespace-nowrap">
                        {e.graduationDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Previous reviewer notes */}
          {profile?.verificationNotes && (
            <section className="rounded-xl border border-brand-border bg-white p-5">
              <h2 className="font-semibold text-base text-brand-foreground mb-2">Previous notes</h2>
              <p className="text-sm text-brand-foreground-muted leading-relaxed whitespace-pre-line">
                {profile.verificationNotes}
              </p>
            </section>
          )}
        </div>

        {/* Right sidebar: review form */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-brand-border bg-white p-5 sticky top-6">
            <h2 className="font-semibold text-base text-brand-foreground mb-4">Review decision</h2>
            <VerificationReviewForm userId={user.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
