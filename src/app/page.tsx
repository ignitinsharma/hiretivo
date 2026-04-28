import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { UserRole, JobStatus } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";

const SHOW_COMING_SOON = process.env.NEXT_PUBLIC_SHOW_COMING_SOON === 'true';

export const metadata = generatePageMetadata({
  title: "Skills-Based Remote Job Portal",
  description: "Find remote jobs matched to your skills. No resume black holes — just skill-based matching for developers, designers, and more.",
});

function formatStat(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k+`;
  if (n > 100) return `${n}+`;
  return String(n);
}

export default async function Home() {
  if (SHOW_COMING_SOON) {
    return <ComingSoonPage />;
  }

  const [activeJobCount, seekerCount, companyCount, featuredJobs] = await Promise.all([
    prisma.job.count({ where: { status: JobStatus.OPEN } }).catch(() => 0),
    prisma.user.count({ where: { role: UserRole.SEEKER } }).catch(() => 0),
    prisma.recruiterProfile.count().catch(() => 0),
    prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      orderBy: { createdAt: 'desc' },
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
    }).catch(() => []),
  ]);
  return (
    <>
      <Header />
      <main>
        <section className="pt-20 pb-16 px-4 grid-bg" data-purpose="hero-section">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full mb-8">
              <span className="text-black text-sm font-bold tracking-wide">
                ✦ {formatStat(activeJobCount)} remote jobs available
              </span>
            </div>
            <h1 className="text-foreground text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
              Find remote work <br />
              <span className="text-black italic">
                that fits your life
              </span>
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
              <Link
                className="text-black font-medium hover:underline"
                href="#"
              >
                React Developer
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                className="text-black font-medium hover:underline"
                href="#"
              >
                Product Designer
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                className="text-black font-medium hover:underline"
                href="#"
              >
                Sales Lead
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                className="text-black font-medium hover:underline"
                href="#"
              >
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
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border-2 border-white flex items-center justify-center">
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
                    <div className="p-2 rounded-lg bg-gray-50/50 border border-black/10 flex items-center justify-between">
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
                    <div className="p-2 rounded-lg bg-gray-50/50 border border-black/10 flex items-center justify-between">
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
                    <div className="p-2 rounded-lg bg-gray-50/50 border border-black/10 flex items-center justify-between">
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
                        stroke="#000000"
                        strokeDasharray="251.2"
                        strokeDashoffset="2.5"
                        strokeWidth="8"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-black leading-none">
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
                    <div className="px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-bold inline-flex items-center gap-1.5">
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
                            <div className="bg-black h-full w-[95%]"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Remote Workflow
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-black h-full w-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">SaaS Industry</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-black h-full w-[90%]"></div>
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

        <section className="py-24 bg-gray-50" data-purpose="featured-jobs">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-foreground text-3xl font-extrabold mb-2">
                  Latest Remote Jobs
                </h2>
                <p className="text-muted-foreground">
                  Top hand-picked opportunities from remote-first teams.
                </p>
              </div>
              <Link
                className="text-black font-bold hover:underline hidden sm:block"
                href="/jobs"
              >
                View all jobs →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-muted-foreground">
                  No jobs available yet. Check back soon!
                </div>
              ) : (
                featuredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-black/50 transition-all  group"
                    data-purpose="job-card"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        {job.recruiter.recruiterProfile?.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={job.recruiter.recruiterProfile.companyName}
                            className="w-full h-full object-cover"
                            src={job.recruiter.recruiterProfile.logo}
                          />
                        ) : (
                          <span className="text-black font-bold text-lg">
                            {job.recruiter.recruiterProfile?.companyName?.[0] ?? 'H'}
                          </span>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-gray-50 text-black text-xs font-bold rounded-full">
                        New
                      </span>
                    </div>
                    <h3 className="text-foreground text-lg font-bold mb-2 group-hover:text-black transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.jobType && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase rounded">
                          {job.jobType.replace('_', '-')}
                        </span>
                      )}
                      {job.category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase rounded">
                          {job.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-black font-bold text-sm">
                        {job.salaryMin && job.salaryMax
                          ? `$${Math.round(job.salaryMin / 1000)}k – $${Math.round(job.salaryMax / 1000)}k`
                          : 'Competitive'}
                      </span>
                      <Link
                        className="text-foreground font-semibold text-sm hover:translate-x-1 transition-transform"
                        href={`/jobs/${job.id}`}
                      >
                        View Job →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="py-24 bg-black grid-bg" data-purpose="categories-section">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
                Browse by Category
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Explore high-paying remote roles across the industry&apos;s most
                in-demand categories.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center hover:border-white/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">code</span>
                </div>
                <h4 className="text-white font-semibold mb-1">Engineering</h4>
                <span className="text-gray-500 text-sm">1,240 jobs</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center hover:border-white/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">palette</span>
                </div>
                <h4 className="text-white font-semibold mb-1">Design</h4>
                <span className="text-gray-500 text-sm">450 jobs</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center hover:border-white/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">pie_chart</span>
                </div>
                <h4 className="text-white font-semibold mb-1">Marketing</h4>
                <span className="text-gray-500 text-sm">320 jobs</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center hover:border-white/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <h4 className="text-white font-semibold mb-1">Sales</h4>
                <span className="text-gray-500 text-sm">215 jobs</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-black grid-bg" data-purpose="recruiters-cta">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-white text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Supercharge your <br />
              hiring efforts
            </h2>
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              See why Hiretivo is the skills-based hiring platform of choice for
              modern remote-first teams.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                href="/recruiter/register"
                className="px-8 py-3.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
              >
                Start for free
              </Link>
              <Link
                href="/recruiter/register"
                className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-colors inline-block"
              >
                Get a demo
              </Link>
            </div>
            <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">G</span>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-white text-xs">★</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">P</span>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-white text-xs">★</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">★</span>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="text-white text-xs">★</span>
                  ))}
                  <span className="text-white/50 text-xs">★</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
