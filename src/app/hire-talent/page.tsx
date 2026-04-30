import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarCheck,
  FileText,
  Gauge,
  LineChart,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FindYourPeopleSection } from "@/components/shared/FindYourPeopleSection";
import { Button } from "@/components/ui/button";
import { JobStatus, UserRole } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";

export const metadata = generatePageMetadata({
  title: "Hire Remote Talent",
  description:
    "Hire skilled remote talent with match clarity, application tracking, and recruiter dashboard visibility.",
  path: "/hire-talent",
});

interface StatItem {
  label: string;
  value: string;
  description: string;
}

interface CandidatePreview {
  name: string;
  role: string;
  match: number;
  skills: string[];
  stage: string;
}

interface FeatureItem {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

interface WorkflowStep {
  label: string;
  title: string;
  description: string;
}

const CANDIDATES: CandidatePreview[] = [
  {
    name: "Aarav Mehta",
    role: "Senior React Engineer",
    match: 94,
    skills: ["React", "Node.js", "Remote"],
    stage: "Shortlist",
  },
  {
    name: "Maya Chen",
    role: "Product Designer",
    match: 89,
    skills: ["Figma", "Systems", "SaaS"],
    stage: "Interview",
  },
  {
    name: "Sofia Reyes",
    role: "Growth Marketer",
    match: 86,
    skills: ["SEO", "Lifecycle", "B2B"],
    stage: "Review",
  },
];

const FEATURES: FeatureItem[] = [
  {
    title: "Skill-match scoring",
    description:
      "See how each applicant maps to your required skills before your team spends time reviewing resumes.",
    icon: Gauge,
  },
  {
    title: "Applicant pipeline",
    description:
      "Track applications, shortlist strong profiles, and keep every hiring stage visible from one workspace.",
    icon: FileText,
  },
  {
    title: "Recruiter workspace",
    description:
      "Manage active jobs, recent applicants, match quality, and hiring signals without leaving the dashboard.",
    icon: BarChart3,
  },
];

const WORKFLOW: WorkflowStep[] = [
  {
    label: "01",
    title: "Post a skills-first role",
    description:
      "Define the remote role, required skills, compensation, and expectations in a structured job post.",
  },
  {
    label: "02",
    title: "Review ranked matches",
    description:
      "Use match percentages and skill signals to focus on candidates who fit the role requirements.",
  },
  {
    label: "03",
    title: "Move applicants forward",
    description:
      "Shortlist, schedule, and update application stages while the pipeline stays organized.",
  },
  {
    label: "04",
    title: "Hire with context",
    description:
      "Keep role performance, applicant quality, and hiring activity visible as your team scales.",
  },
];

const RESULT_STATS: StatItem[] = [
  {
    label: "Profile setup",
    value: "5 minutes",
    description: "to create a role-ready employer profile",
  },
  {
    label: "Candidate response",
    value: "2x",
    description: "stronger replies from matched remote talent",
  },
  {
    label: "Review time saved",
    value: "6 hours",
    description: "saved per role with skills-first review",
  },
];

function formatStat(count: number): string {
  if (count >= 1000) return `${Math.round(count / 1000)}k+`;
  if (count > 100) return `${count}+`;
  return String(count);
}

function InitialsBadge({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-sm font-semibold text-brand-foreground">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div
      className="rounded-xl border border-brand-border bg-white p-4 md:p-5"
      aria-label="Recruiter dashboard preview"
    >
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-brand-foreground-secondary">
            Recruiter dashboard preview
          </p>
          <h2 className="mt-1 text-lg font-semibold text-brand-foreground">
            Hiring overview
          </h2>
        </div>
        <div className="rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white">
          Live pipeline
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Active jobs", value: "12", icon: Briefcase },
          { label: "New applicants", value: "24", icon: Users },
          { label: "Avg. match", value: "88%", icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-brand-border bg-white p-4"
          >
            <Icon className="mb-3 h-4 w-4 text-brand-primary" />
            <p className="text-2xl font-bold leading-tight tracking-tight text-brand-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs font-medium text-brand-foreground-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-brand-border bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-brand-foreground">
              Recent applicants
            </h3>
            <span className="text-xs font-medium text-brand-primary">
              Ranked by match
            </span>
          </div>
          <div className="space-y-3">
            {CANDIDATES.map((candidate) => (
              <div
                key={candidate.name}
                className="rounded-lg border border-brand-border bg-brand-surface p-3"
              >
                <div className="flex items-start gap-3">
                  <InitialsBadge name={candidate.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-tight text-brand-foreground">
                          {candidate.name}
                        </p>
                        <p className="text-xs text-brand-foreground-muted">
                          {candidate.role}
                        </p>
                      </div>
                      <span className="rounded-full border border-brand-primary/20 bg-white px-2.5 py-1 text-xs font-semibold text-brand-primary">
                        {candidate.match}%
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-brand-primary/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
                        {candidate.stage}
                      </span>
                      {candidate.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-brand-border bg-white px-2.5 py-1 text-[11px] font-medium text-brand-foreground-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-foreground">
                Candidate pipeline
              </h3>
              <LineChart className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="space-y-3">
              {[
                { label: "Review", width: "72%" },
                { label: "Shortlist", width: "48%" },
                { label: "Interview", width: "31%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-brand-foreground-muted">
                      {item.label}
                    </span>
                    <span className="font-semibold text-brand-foreground">
                      {item.width}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-surface-hover">
                    <div
                      className="h-2 rounded-full bg-brand-primary"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-brand-foreground">
              Role performance
            </h3>
            <div
              className="grid grid-cols-7 items-end gap-1.5"
              aria-hidden="true"
            >
              {[38, 54, 42, 68, 61, 76, 88].map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="rounded-t-md bg-brand-primary/80"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getPublicStats(): Promise<StatItem[]> {
  const [activeJobCount, seekerCount, companyCount] = await Promise.all([
    prisma.job.count({ where: { status: JobStatus.OPEN } }).catch(() => 0),
    prisma.user.count({ where: { role: UserRole.SEEKER } }).catch(() => 0),
    prisma.recruiterProfile.count().catch(() => 0),
  ]);

  return [
    {
      label: "Active remote jobs",
      value: formatStat(activeJobCount),
      description: "Live roles currently open on Hiretivo.",
    },
    {
      label: "Job seekers",
      value: formatStat(seekerCount),
      description: "Professionals building remote-first profiles.",
    },
    {
      label: "Companies hiring",
      value: formatStat(companyCount),
      description: "Recruiter workspaces created on Hiretivo.",
    },
  ];
}

export default async function HireTalentPage() {
  const stats = await getPublicStats();

  return (
    <>
      <Header publicAudience="recruiter" />
      <main data-purpose="hire-talent-page">
        <section className="grid-bg border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-semibold text-brand-foreground">
                <Search className="h-4 w-4 text-brand-primary" />
                For remote hiring teams
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl lg:text-6xl">
                Hire skilled remote talent with match clarity.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-foreground-muted">
                Post roles, review skill-match scores, and move candidates
                through a clean recruiter pipeline built for remote-first teams.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="primary" size="lg">
                  <Link href="/recruiter/register">
                    Start hiring
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section className="border-b border-brand-border bg-white px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl rounded-xl border border-brand-border bg-brand-primary/5 p-6 md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.05em] text-brand-primary">
                Hiring impact
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
                Real results, from day one
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-foreground-muted">
                Faster role setup, stronger candidate signals, and less time
                spent sorting through applications that were never a fit.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {RESULT_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-brand-border bg-white p-6 text-center"
                >
                  <p className="text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
                    {stat.value}
                  </p>
                  <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.05em] text-brand-foreground">
                    {stat.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-brand-primary/20 bg-white/80 px-4 py-3"
                >
                  <p className="text-xl font-bold tracking-tight text-brand-primary">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.05em] text-brand-foreground-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid-bg bg-white px-4 py-20 md:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 rounded-xl border border-brand-border bg-white p-6 md:p-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.05em] text-brand-primary">
                Recruiter workspace
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
                Ready to find your people?
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-foreground-muted">
                Connect with remote talent that fits your role, understands the
                work, and can move through your pipeline with clear skills
                context from the first review.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="primary" size="lg">
                  <Link href="/recruiter/register">
                    Start hiring
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>

            <div className="relative min-h-[430px] overflow-visible rounded-xl border border-brand-border bg-brand-primary/5 p-4 md:min-h-[520px] md:p-8">
              <div className="absolute left-1/2 -top-14 w-[82%] -translate-x-1/2 overflow-hidden rounded-xl border border-brand-border bg-white md:top-[-90px]">
                <div className="flex h-8 items-center justify-between border-b border-brand-border bg-white px-3">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
                    H
                  </span>
                  <span className="text-lg font-bold leading-none tracking-widest text-brand-foreground-muted">
                    ...
                  </span>
                  <span className="text-lg leading-none text-brand-primary">
                    ×
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Two teammates collaborating around a laptop"
                  className="h-64 w-full object-cover md:h-96"
                  src="https://images.pexels.com/photos/7652189/pexels-photo-7652189.jpeg?auto=compress&cs=tinysrgb&w=1200"
                />
              </div>

              <div className="absolute bottom-8 right-6 w-[58%] overflow-hidden rounded-xl border border-brand-border bg-white md:bottom-12 md:right-10">
                <div className="flex h-8 items-center justify-between border-b border-brand-border bg-white px-3">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
                    H
                  </span>
                  <span className="text-lg font-bold leading-none tracking-widest text-brand-foreground-muted">
                    ...
                  </span>
                  <span className="text-lg leading-none text-brand-primary">
                    ×
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Hiring teammates reviewing candidates"
                  className="h-44 w-full object-cover md:h-64"
                  src="https://cdn.pixabay.com/photo/2024/04/18/10/09/woman-8703991_1280.jpg"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.05em] text-brand-primary">
                Hiring workflow
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
                From job post to shortlist in one organized flow.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-foreground-muted">
                Recruiters can move from role setup to candidate review with the
                same skills-first context visible throughout the process.
              </p>
            </div>
            <div className="group/workflow grid gap-4 sm:grid-cols-2">
              {WORKFLOW.map((step, index) => {
                const rotationClass = [
                  "sm:-rotate-2",
                  "sm:rotate-1",
                  "sm:rotate-2",
                  "sm:-rotate-1",
                ][index];

                return (
                  <div
                    key={step.label}
                    className={`${rotationClass} group relative min-h-52 overflow-hidden rounded-xl border border-brand-border bg-white/80 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:rotate-0 hover:border-brand-primary/40 hover:bg-brand-primary/5 group-hover/workflow:sm:mx-2`}
                  >
                    <span className="text-sm font-bold text-brand-primary">
                      {step.label}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-brand-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                      {step.description}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center border-t border-brand-primary/20 bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-transform duration-500 group-hover:translate-y-0">
                      {step.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <FindYourPeopleSection
          clientCount={stats[2]?.value ?? "0"}
          candidateCount={stats[1]?.value ?? "0"}
        />

        <section className="bg-brand-surface px-4 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.05em] text-brand-primary">
                Product signal
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
                Give hiring teams the context they need before the first call.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {FEATURES.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-xl border border-brand-border bg-white p-6"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-brand-foreground">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-surface px-4 py-20 md:px-8">
          <div className="mx-auto max-w-5xl rounded-xl border border-brand-border bg-white p-8 text-center md:p-12">
            <CalendarCheck className="mx-auto mb-5 h-10 w-10 text-brand-primary" />
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              Start building your remote hiring pipeline.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-foreground-muted">
              Create a recruiter account, publish your first role, and see how
              Hiretivo turns skills into clearer candidate decisions.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="primary" size="lg">
                <Link href="/recruiter/register">
                  Start hiring
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
