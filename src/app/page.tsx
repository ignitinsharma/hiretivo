import type { ComponentType } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Code2,
  DollarSign,
  Globe2,
  Headphones,
  Megaphone,
  Palette,
  PackageCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { UserRole, JobStatus } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";
import { FindYourPeopleSection } from "@/components/shared/FindYourPeopleSection";

const SHOW_COMING_SOON = process.env.NEXT_PUBLIC_SHOW_COMING_SOON === "true";

interface CategoryShowcaseItem {
  title: string;
  count: string;
  roles: string;
  salary: string;
  skills: string[];
  icon: ComponentType<{ className?: string }>;
}

const CATEGORY_SHOWCASE: CategoryShowcaseItem[] = [
  {
    title: "Engineering",
    count: "1,240 roles",
    roles: "Frontend, Backend, Full-stack",
    salary: "$120k - $210k",
    skills: ["React", "Node.js", "AI"],
    icon: Code2,
  },
  {
    title: "Design",
    count: "450 roles",
    roles: "Product, Brand, UX systems",
    salary: "$90k - $165k",
    skills: ["Figma", "UX", "SaaS"],
    icon: Palette,
  },
  {
    title: "Product",
    count: "380 roles",
    roles: "Growth, Platform, AI products",
    salary: "$130k - $220k",
    skills: ["Roadmaps", "Data", "Remote"],
    icon: PackageCheck,
  },
  {
    title: "Marketing",
    count: "320 roles",
    roles: "Lifecycle, SEO, Demand gen",
    salary: "$85k - $150k",
    skills: ["SEO", "CRM", "B2B"],
    icon: Megaphone,
  },
  {
    title: "Sales",
    count: "215 roles",
    roles: "AE, SDR, Partnerships",
    salary: "$100k - $180k",
    skills: ["Pipeline", "SaaS", "Outbound"],
    icon: TrendingUp,
  },
  {
    title: "Customer Support",
    count: "190 roles",
    roles: "Success, Support, Operations",
    salary: "$70k - $130k",
    skills: ["CS", "Ops", "Async"],
    icon: Headphones,
  },
];

export const metadata = generatePageMetadata({
  title: "Skills-Based Remote Job Portal",
  description:
    "Find remote jobs matched to your skills. No resume black holes — just skill-based matching for developers, designers, and more.",
});

function formatStat(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k+`;
  if (n > 100) return `${n}+`;
  return String(n);
}

function formatEnumLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  if (!min && !max) return "Competitive";

  const symbol =
    currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "INR" ? "₹" : "$";
  const formatAmount = (amount: number): string =>
    `${symbol}${Math.round(amount / 1000)}k`;

  if (min && max) return `${formatAmount(min)} – ${formatAmount(max)}`;
  if (min) return `From ${formatAmount(min)}`;
  return max ? `Up to ${formatAmount(max)}` : "Competitive";
}

export default async function Home() {
  if (SHOW_COMING_SOON) {
    return <ComingSoonPage />;
  }

  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === UserRole.RECRUITER ? "/recruiter/dashboard" : "/seeker/dashboard");
  }

  const [activeJobCount, seekerCount, companyCount, featuredJobs] =
    await Promise.all([
      prisma.job.count({ where: { status: JobStatus.OPEN } }).catch(() => 0),
      prisma.user.count({ where: { role: UserRole.SEEKER } }).catch(() => 0),
      prisma.recruiterProfile.count().catch(() => 0),
      prisma.job
        .findMany({
          where: { status: JobStatus.OPEN },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            skills: { include: { skill: true } },
            recruiter: {
              select: {
                recruiterProfile: {
                  select: { companyName: true, logo: true },
                },
              },
            },
          },
        })
        .catch(() => []),
    ]);
  return (
    <>
      <Header />
      <main>
        <section
          className="pt-20 pb-16 px-4 grid-bg"
          data-purpose="hero-section"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full mb-8">
              <span className="text-black text-sm font-bold tracking-wide">
                ✦ {formatStat(activeJobCount)} remote jobs available
              </span>
            </div>
            <h1 className="text-foreground text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
              <span className="text-brand-primary">Find remote work</span>{" "}
              <br />
              <span className="text-black italic">that fits your life</span>
            </h1>
            <p className="text-muted-foreground text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
              Find your first remote job that fits your lifestyle. Thousands of
              remote-first companies hiring now. No commute required.
            </p>
            <div
              className="relative max-w-2xl mx-auto mb-8"
              data-purpose="hero-search"
            >
              <div className="flex items-center bg-white border border-gray-200 p-2 rounded-full ">
                <div className="pl-6 flex items-center grow">
                  <span className="material-symbols-outlined text-gray-400">
                    search
                  </span>
                  <input
                    className="w-full border-none focus:ring-0 text-foreground font-medium placeholder-gray-400 focus:outline-none"
                    placeholder="Job title, keywords, or company..."
                    type="text"
                  />
                </div>
                <Button variant="primary" size="lg" className="rounded-full">
                  Search Jobs
                </Button>
              </div>
            </div>
            <div
              className="flex flex-wrap justify-center gap-3 text-sm"
              data-purpose="popular-tags"
            >
              <span className="text-muted-foreground">Popular:</span>
              <Link className="text-black font-medium hover:underline" href="#">
                React Developer
              </Link>
              <span className="text-gray-300">•</span>
              <Link className="text-black font-medium hover:underline" href="#">
                Product Designer
              </Link>
              <span className="text-gray-300">•</span>
              <Link className="text-black font-medium hover:underline" href="#">
                Sales Lead
              </Link>
              <span className="text-gray-300">•</span>
              <Link className="text-black font-medium hover:underline" href="#">
                Content Writer
              </Link>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-gray-50/50 overflow-hidden grid-bg"
          data-purpose="ai-matchmaking"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-5/12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-black rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <span className="material-symbols-outlined text-sm">
                    bolt
                  </span>
                  Smart Technology
                </div>
                <h2 className="text-foreground text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                  Visual Match Breakdown
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  We don&apos;t just give you a number. Our AI maps your DNA
                  directly onto role requirements, providing total transparency
                  on exactly why you&apos;re a fit.
                </p>
                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 ">
                      <span className="material-symbols-outlined text-black">
                        psychology
                      </span>
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">
                        Semantic Skill Mapping
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Our engine understands that &quot;React&quot; also
                        implies expertise in &quot;Hooks&quot; and &quot;Virtual
                        DOM&quot;.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 ">
                      <span className="material-symbols-outlined text-black">
                        language
                      </span>
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">
                        Timezone Compatibility
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Calculated overlap based on your preference for async
                        vs. sync communication.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="primary" size="lg" className="group">
                  Get Matched Now
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Button>
              </div>

              <div
                className="lg:w-7/12 relative min-h-[600px] flex items-center justify-center"
                data-purpose="matching-visual"
              >
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  viewBox="0 0 700 600"
                >
                  <path
                    className=""
                    d="M220 185 Q350 185 450 365"
                    fill="none"
                    opacity="0.4"
                    stroke="#000000"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    className=""
                    d="M220 225 Q350 255 450 405"
                    fill="none"
                    opacity="0.4"
                    stroke="#000000"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    className=""
                    d="M100 280 Q250 450 450 445"
                    fill="none"
                    opacity="0.4"
                    stroke="#000000"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  ></path>
                </svg>

                <div className="absolute top-0 left-0 w-72 bg-white rounded-xl border border-gray-200 p-5  z-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Sarah"
                        className="w-12 h-12 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUqv2uMlfz6K-UTHWuIZ4yO069aksF84VRAFPayGhBehWmwwqMj_EGUM9BTqpi6l5Zsa4AvUOE1WMoZWSydMfP7Z1GzEHVBUYrTv2gJ8wbYtS32mCJ5lzhejdzdcC8BMhsjH88KGjc0GfLoKRMtLu_1UuStcw43bnCNJ7e2uUE3mMp1VQWI2yIHQZGshiVFbLdnWkLLgvdityHoZ2a0kEuGdcG4kzuLdbERyIhx_I_KmJDfGcAsJmkxamwzU58RHMgZ_NTVWxNonLr"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-primary rounded-full border-2 border-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px] font-bold">
                          check
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-foreground font-extrabold text-sm">
                        Sarah Jenkins
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Sr. Product Designer
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2 rounded-lg bg-gray-50/50 border border-brand-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-black text-xs">
                          verified
                        </span>
                        <span
                          className="text-[11px] font-bold text-foreground"
                          id="tag-skill-1"
                        >
                          Figma Expert
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-black">
                        MATCH
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50/50 border border-brand-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-black text-xs">
                          history
                        </span>
                        <span
                          className="text-[11px] font-bold text-foreground"
                          id="tag-skill-2"
                        >
                          8+ Yrs Exp.
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-black">
                        MATCH
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50/50 border border-brand-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-black text-xs">
                          schedule
                        </span>
                        <span
                          className="text-[11px] font-bold text-foreground"
                          id="tag-skill-3"
                        >
                          UTC-5 Pref.
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-black">
                        MATCH
                      </span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-xl border-4 border-gray-50 p-6  z-30 text-center">
                  <div className="mb-4 relative inline-block">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        fill="transparent"
                        r="40"
                        stroke="#F5F3FF"
                        strokeWidth="8"
                      ></circle>
                      <circle
                        cx="48"
                        cy="48"
                        fill="transparent"
                        r="40"
                        stroke="#7560ff"
                        strokeDasharray="251.2"
                        strokeDashoffset="2.5"
                        strokeWidth="8"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-brand-primary leading-none">
                        99%
                      </span>
                      <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter mt-0.5">
                        Confidence
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <h5 className="text-xs font-bold text-foreground">
                      Match Insight
                    </h5>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Sarah&apos;s focus on design systems perfectly aligns with
                      the team&apos;s upcoming Q4 roadmap.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-[10px] font-bold text-black">
                        98.4%
                      </div>
                      <div className="text-[8px] font-medium text-gray-400">
                        Technical
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-[10px] font-bold text-black">
                        100%
                      </div>
                      <div className="text-[8px] font-medium text-gray-400">
                        Culture
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="px-4 py-1.5 bg-brand-primary text-white rounded-full text-[10px] font-bold inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[12px]">
                        auto_awesome
                      </span>
                      AI Recommended
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 w-72 bg-white rounded-xl border border-gray-200 p-5  z-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center  overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Company"
                        className="w-8 h-8 object-contain"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBudUmVpAIfQEo5LWIcNZV-xhO3w73zs9WTYTYyYzccDahL6mdXvJpe6OivRsM6nEZZokxr8XuRpLeYDLuEANPcAgWcliP2It74EflPCYyKE5VlXuAkgsVifYR8oLEu1qGz0NkhxUaqNSyX2R41726SxZpDOVIXCpOZj3js3zZkrSLmskW12CiRdM_9QfQRBu-V7HhAQKyHG1DK5m6I4dcS0ODDJdCUmJWfyxMIfbX89Szf9m_-dJKTpsT9oTGl-GRP48pIVx8WS28i"
                      />
                    </div>
                    <div>
                      <h4 className="text-foreground font-extrabold text-sm">
                        Senior Product Designer
                      </h4>
                      <p className="text-[10px] font-bold text-black uppercase tracking-widest">
                        Global Scale-up
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">
                        Requirements Breakdown
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Design Systems
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-[95%]"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Remote Workflow
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            SaaS Industry
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-[90%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <span className="text-foreground font-extrabold text-xs">
                        $145k – $190k
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Full-time • Remote
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="bg-white border-y border-gray-200 py-12"
          data-purpose="stats-bar"
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-black text-4xl font-extrabold mb-2">
                  {formatStat(activeJobCount)}
                </div>
                <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
                  Active Jobs
                </div>
              </div>
              <div>
                <div className="text-black text-4xl font-extrabold mb-2">
                  {formatStat(companyCount)}
                </div>
                <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
                  Companies Hiring
                </div>
              </div>
              <div>
                <div className="text-black text-4xl font-extrabold mb-2">
                  {formatStat(seekerCount)}
                </div>
                <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
                  Job Seekers
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-surface py-20 md:py-24" data-purpose="featured-jobs">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-12">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                  Fresh roles, checked daily
                </div>
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
                  Latest Remote Jobs
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
                  Hand-picked remote roles from teams hiring for real skills,
                  not keyword-stuffed resumes.
                </p>
              </div>
              <Link
                className="hidden items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:border-brand-primary hover:text-brand-primary sm:inline-flex"
                href="/jobs"
              >
                View all jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.length === 0 ? (
                <div className="rounded-xl border border-brand-border bg-white py-12 text-center text-brand-foreground-muted md:col-span-2 lg:col-span-3">
                  No jobs available yet. Check back soon!
                </div>
              ) : (
                featuredJobs.map((job) => {
                  const profile = job.recruiter.recruiterProfile;
                  const companyName = profile?.companyName ?? "Hiretivo";
                  const logoUrl = resolveLogoUrl(profile?.logo);
                  const jobType = formatEnumLabel(job.jobType);
                  const workType = formatEnumLabel(job.workType);
                  const salary = formatSalaryRange(
                    job.salaryMin,
                    job.salaryMax,
                    job.currency,
                  );

                  return (
                    <article
                      key={job.id}
                      className="group flex h-full min-h-[270px] flex-col rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary"
                      data-purpose="job-card"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
                            {logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={`${companyName} logo`}
                                className="h-full w-full object-cover"
                                src={logoUrl}
                              />
                            ) : (
                              <span className="text-lg font-bold text-brand-primary">
                                {companyName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-brand-foreground">
                              {companyName}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-foreground-muted">
                              <Globe2 className="h-3.5 w-3.5 text-brand-primary" />
                              <span>{workType ?? "Remote friendly"}</span>
                            </div>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-foreground">
                          New
                        </span>
                      </div>

                      <Link href={`/jobs/${job.id}`} className="block">
                        <h3 className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground transition-colors group-hover:text-brand-primary">
                          {job.title}
                        </h3>
                      </Link>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {jobType && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
                            <Clock3 className="h-3.5 w-3.5" />
                            {jobType}
                          </span>
                        )}
                        {job.category && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                            {job.category}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-brand-border pt-5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-brand-foreground">
                            <DollarSign className="h-4 w-4 shrink-0 text-brand-primary" />
                            <span className="truncate">{salary}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-foreground-muted">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Direct company role</span>
                          </div>
                        </div>
                        <Link
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a47d9]"
                          href={`/jobs/${job.id}`}
                        >
                          View
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
            <Link
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:border-brand-primary hover:text-brand-primary sm:hidden"
              href="/jobs"
            >
              View all jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section
          className="py-24 bg-white grid-bg"
          data-purpose="categories-section"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-semibold text-brand-foreground">
                  <Sparkles className="h-4 w-4 text-brand-primary" />
                  Skills-first discovery
                </div>
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
                  Explore Jobs based on your skills
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-foreground-muted">
                  Explore high-paying remote roles across the industry&apos;s
                  most in-demand categories.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="primary" size="lg">
                    <Link href="/jobs">
                      Find that job
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/seeker/register">Create profile</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-brand-border bg-brand-primary/10 p-4 md:p-8">
                <div className="mb-6 rounded-xl border border-brand-border bg-white px-5 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.05em] text-brand-foreground-secondary">
                        Matched categories
                      </p>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight text-brand-foreground">
                        Remote roles that fit your skills
                      </h3>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary">
                      <BriefcaseBusiness className="h-4 w-4" />
                      {formatStat(activeJobCount)} open jobs
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {CATEGORY_SHOWCASE.map(
                    ({ title, count, roles, salary, skills, icon: Icon }) => (
                      <Link
                        key={title}
                        href="/jobs"
                        className="group rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary/50"
                      >
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="rounded-lg border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
                            {count}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold tracking-tight text-brand-foreground">
                          {title}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                          {roles}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-foreground">
                          <DollarSign className="h-4 w-4 text-brand-primary" />
                          {salary}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={`${title}-${skill}`}
                              className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground-muted"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <FindYourPeopleSection
          clientCount={formatStat(companyCount)}
          candidateCount={formatStat(seekerCount)}
          className="bg-gray-50 px-4 py-20 md:px-8"
        />
      </main>
      <Footer />
    </>
  );
}
