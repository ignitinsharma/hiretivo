import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";

/*
 * generateMetadata
 * Returns SEO metadata for the public engineer profile page.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const engineer = await prisma.user.findFirst({
    where: { profileSlug: params.slug, verificationStatus: "VERIFIED", seekerProfile: { is: { profilePublic: true } } },
    select: { name: true, seekerProfile: { select: { primaryRole: true } } },
  });
  if (!engineer) return {};
  return {
    title: `${engineer.name} — Hiretivo Verified Engineer`,
    description: `${engineer.name} is a verified ${engineer.seekerProfile?.primaryRole ?? "engineer"} available on Hiretivo.`,
  };
}

/*
 * PublicEngineerProfile
 * Server component that renders a verified engineer's public profile at /e/[slug].
 * Returns 404 unless verificationStatus=VERIFIED AND profilePublic=true AND hiddenUntil not active.
 * Shows: name, verified badge, hiretivoScore, skills, bio, top 3 projects, salary, timezone, availability.
 * Always hides: email, githubUrl, linkedinUrl (never queried from DB).
 */
export default async function PublicEngineerProfile({ params }: { params: { slug: string } }) {
  const engineer = await prisma.user.findFirst({
    where: {
      profileSlug: params.slug,
      verificationStatus: "VERIFIED",
      seekerProfile: { is: { profilePublic: true } },
      AND: [{ OR: [{ hiddenUntil: null }, { hiddenUntil: { lt: new Date() } }] }],
    },
    select: {
      id: true,
      name: true,
      hiretivoScore: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          bio: true,
          primaryRole: true,
          yearsExperience: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          topProjects: true,
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
  });

  if (!engineer) notFound();

  const profile = engineer.seekerProfile;
  const topProjects = (profile?.topProjects as Array<{ name: string; description: string; url: string }> | null) ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        {/* Hero */}
        <section className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-3xl text-brand-foreground">{engineer.name}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-brand-primary-foreground">
              ✓ Verified
            </span>
          </div>
          <p className="text-brand-foreground-muted">{profile?.primaryRole}</p>
          <div className="flex items-center gap-2 text-sm text-brand-foreground-muted">
            <span>Hiretivo Score: <strong className="text-brand-foreground">{engineer.hiretivoScore ?? 0}/100</strong></span>
            <span>·</span>
            <span>{profile?.yearsExperience ?? 0} yrs exp</span>
          </div>
        </section>

        {/* Skills */}
        {(profile?.skills?.length ?? 0) > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 font-semibold text-sm uppercase tracking-wider text-brand-foreground-secondary">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile!.skills.map((s) => (
                <span key={s.skill.name} className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1 text-sm text-brand-foreground">
                  {s.skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Compensation & availability */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Salary Range</p>
            <p className="mt-1 font-semibold text-brand-foreground">
              ${profile?.salaryMinUsd?.toLocaleString()} – ${profile?.salaryMaxUsd?.toLocaleString()} /yr
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Timezone Overlap</p>
            <p className="mt-1 font-semibold text-brand-foreground">{engineer.timezoneOverlapHours ?? 0}h with US/EU</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Available From</p>
            <p className="mt-1 font-semibold text-brand-foreground">
              {engineer.availableFrom ? format(engineer.availableFrom, "MMM d, yyyy") : "Immediately"}
            </p>
          </div>
        </section>

        {/* Bio */}
        {profile?.bio && (
          <section className="mb-6">
            <h2 className="mb-2 font-semibold text-sm uppercase tracking-wider text-brand-foreground-secondary">About</h2>
            <p className="text-base text-brand-foreground leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* Top Projects */}
        {topProjects.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 font-semibold text-sm uppercase tracking-wider text-brand-foreground-secondary">Projects</h2>
            <div className="flex flex-col gap-4">
              {topProjects.slice(0, 3).map((proj, i) => (
                <div key={i} className="rounded-xl border border-brand-border bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-brand-foreground">{proj.name}</h3>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer nofollow"
                         className="shrink-0 text-xs text-brand-primary hover:underline">
                        View →
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-brand-foreground-muted">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA banner for non-recruiter visitors */}
        <section className="rounded-xl border border-brand-border bg-brand-surface p-6 text-center">
          <p className="font-semibold text-brand-foreground">
            Hire engineers like {engineer.name?.split(" ")[0]}
          </p>
          <p className="mt-1 text-sm text-brand-foreground-muted">Sign up free and unlock verified engineer profiles</p>
          <a href="/auth/signup" className="mt-4 inline-block rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary-foreground hover:bg-brand-primary-dk">
            Sign up free →
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
