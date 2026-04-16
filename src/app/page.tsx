import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole, JobStatus } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";

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
  const session = await auth();
  if (session?.user) {
    if (session.user.role === UserRole.SEEKER) {
      redirect("/seeker/dashboard");
    }
    if (session.user.role === UserRole.RECRUITER) {
      redirect("/recruiter/dashboard");
    }
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
        <section className="pt-20 pb-16 px-4" data-purpose="hero-section">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-light rounded-full mb-8">
              <span className="text-brand-primary text-sm font-bold tracking-wide">
                ✦ {formatStat(activeJobCount)} remote jobs available
              </span>
            </div>
            <h1 className="text-heading text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
              Find remote work <br />
              <span className="text-brand-primary italic">
                that fits your life
              </span>
            </h1>
            <p className="text-brand-body text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
              Find your first remote job that fits your lifestyle. Thousands of
              remote-first companies hiring now. No commute required.
            </p>
            <div
              className="relative max-w-2xl mx-auto mb-8"
              data-purpose="hero-search"
            >
              <div className="flex items-center bg-white border border-brand-border p-2 rounded-full card-shadow">
                <div className="pl-6 flex items-center grow">
                  <span className="material-symbols-outlined text-gray-400">
                    search
                  </span>
                  <input
                    className="w-full border-none focus:ring-0 text-brand-heading font-medium placeholder-gray-400 focus:outline-none"
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
              <span className="text-brand-body">Popular:</span>
              <Link
                className="text-brand-primary font-medium hover:underline"
                href="#"
              >
                React Developer
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                className="text-brand-primary font-medium hover:underline"
                href="#"
              >
                Product Designer
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                className="text-brand-primary font-medium hover:underline"
                href="#"
              >
                Sales Lead
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                className="text-brand-primary font-medium hover:underline"
                href="#"
              >
                Content Writer
              </Link>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-brand-gray/50 overflow-hidden"
          data-purpose="ai-matchmaking"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-5/12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <span className="material-symbols-outlined text-sm">
                    bolt
                  </span>
                  Smart Technology
                </div>
                <h2 className="text-heading text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                  Visual Match Breakdown
                </h2>
                <p className="text-brand-body text-lg mb-8 leading-relaxed">
                  We don&apos;t just give you a number. Our AI maps your DNA
                  directly onto role requirements, providing total transparency
                  on exactly why you&apos;re a fit.
                </p>
                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-brand-border flex items-center justify-center shrink-0 card-shadow">
                      <span className="material-symbols-outlined text-brand-primary">
                        psychology
                      </span>
                    </div>
                    <div>
                      <h4 className="text-brand-heading font-bold">
                        Semantic Skill Mapping
                      </h4>
                      <p className="text-sm text-brand-body">
                        Our engine understands that &quot;React&quot; also
                        implies expertise in &quot;Hooks&quot; and &quot;Virtual
                        DOM&quot;.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-brand-border flex items-center justify-center shrink-0 card-shadow">
                      <span className="material-symbols-outlined text-brand-primary">
                        language
                      </span>
                    </div>
                    <div>
                      <h4 className="text-brand-heading font-bold">
                        Timezone Compatibility
                      </h4>
                      <p className="text-sm text-brand-body">
                        Calculated overlap based on your preference for async
                        vs. sync communication.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="primary" size="xl" className="group">
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
                    className="glow-path"
                    d="M220 185 Q350 185 450 365"
                    fill="none"
                    opacity="0.4"
                    stroke="#5951E5"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    className="glow-path"
                    d="M220 225 Q350 255 450 405"
                    fill="none"
                    opacity="0.4"
                    stroke="#5951E5"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    className="glow-path"
                    d="M100 280 Q250 450 450 445"
                    fill="none"
                    opacity="0.4"
                    stroke="#5951E5"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  ></path>
                </svg>

                <div className="absolute top-0 left-0 w-72 bg-white rounded-2xl border border-brand-border p-5 dashboard-shadow z-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Sarah"
                        className="w-12 h-12 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUqv2uMlfz6K-UTHWuIZ4yO069aksF84VRAFPayGhBehWmwwqMj_EGUM9BTqpi6l5Zsa4AvUOE1WMoZWSydMfP7Z1GzEHVBUYrTv2gJ8wbYtS32mCJ5lzhejdzdcC8BMhsjH88KGjc0GfLoKRMtLu_1UuStcw43bnCNJ7e2uUE3mMp1VQWI2yIHQZGshiVFbLdnWkLLgvdityHoZ2a0kEuGdcG4kzuLdbERyIhx_I_KmJDfGcAsJmkxamwzU58RHMgZ_NTVWxNonLr"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-accent rounded-full border-2 border-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px] font-bold">
                          check
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-brand-heading font-extrabold text-sm">
                        Sarah Jenkins
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Sr. Product Designer
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2 rounded-lg bg-brand-light/50 border border-brand-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-primary text-xs">
                          verified
                        </span>
                        <span
                          className="text-[11px] font-bold text-brand-heading"
                          id="tag-skill-1"
                        >
                          Figma Expert
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-brand-primary">
                        MATCH
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-brand-light/50 border border-brand-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-primary text-xs">
                          history
                        </span>
                        <span
                          className="text-[11px] font-bold text-brand-heading"
                          id="tag-skill-2"
                        >
                          8+ Yrs Exp.
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-brand-primary">
                        MATCH
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-brand-light/50 border border-brand-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-primary text-xs">
                          schedule
                        </span>
                        <span
                          className="text-[11px] font-bold text-brand-heading"
                          id="tag-skill-3"
                        >
                          UTC-5 Pref.
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-brand-primary">
                        MATCH
                      </span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-3xl border-4 border-brand-light p-6 dashboard-shadow z-30 text-center">
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
                        stroke="#5951E5"
                        strokeDasharray="251.2"
                        strokeDashoffset="2.5"
                        strokeWidth="8"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-brand-primary leading-none">
                        99%
                      </span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                        Confidence
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <h5 className="text-xs font-bold text-brand-heading">
                      Match Insight
                    </h5>
                    <p className="text-[10px] text-brand-body leading-tight">
                      Sarah&apos;s focus on design systems perfectly aligns with
                      the team&apos;s upcoming Q4 roadmap.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-brand-gray p-2 rounded-lg">
                      <div className="text-[10px] font-bold text-brand-accent">
                        98.4%
                      </div>
                      <div className="text-[8px] font-medium text-gray-400">
                        Technical
                      </div>
                    </div>
                    <div className="bg-brand-gray p-2 rounded-lg">
                      <div className="text-[10px] font-bold text-brand-primary">
                        100%
                      </div>
                      <div className="text-[8px] font-medium text-gray-400">
                        Culture
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <div className="px-4 py-1.5 bg-brand-primary text-white rounded-full text-[10px] font-bold inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[12px]">
                        auto_awesome
                      </span>
                      AI Recommended
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 w-72 bg-white rounded-2xl border border-brand-border p-5 dashboard-shadow z-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white border border-brand-border rounded-xl flex items-center justify-center card-shadow overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Company"
                        className="w-8 h-8 object-contain"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBudUmVpAIfQEo5LWIcNZV-xhO3w73zs9WTYTYyYzccDahL6mdXvJpe6OivRsM6nEZZokxr8XuRpLeYDLuEANPcAgWcliP2It74EflPCYyKE5VlXuAkgsVifYR8oLEu1qGz0NkhxUaqNSyX2R41726SxZpDOVIXCpOZj3js3zZkrSLmskW12CiRdM_9QfQRBu-V7HhAQKyHG1DK5m6I4dcS0ODDJdCUmJWfyxMIfbX89Szf9m_-dJKTpsT9oTGl-GRP48pIVx8WS28i"
                      />
                    </div>
                    <div>
                      <h4 className="text-brand-heading font-extrabold text-sm">
                        Senior Product Designer
                      </h4>
                      <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">
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
                          <span className="text-brand-body">
                            Design Systems
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-[95%]"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-brand-body">
                            Remote Workflow
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-brand-body">SaaS Industry</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-[90%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-brand-border pt-4">
                      <span className="text-brand-heading font-extrabold text-xs">
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
          className="bg-white border-y border-brand-border py-12"
          data-purpose="stats-bar"
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-brand-primary text-4xl font-extrabold mb-2">
                  {formatStat(activeJobCount)}
                </div>
                <div className="text-brand-body font-medium uppercase tracking-wider text-sm">
                  Active Jobs
                </div>
              </div>
              <div>
                <div className="text-brand-primary text-4xl font-extrabold mb-2">
                  {formatStat(companyCount)}
                </div>
                <div className="text-brand-body font-medium uppercase tracking-wider text-sm">
                  Companies Hiring
                </div>
              </div>
              <div>
                <div className="text-brand-primary text-4xl font-extrabold mb-2">
                  {formatStat(seekerCount)}
                </div>
                <div className="text-brand-body font-medium uppercase tracking-wider text-sm">
                  Job Seekers
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-brand-gray" data-purpose="featured-jobs">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-heading text-3xl font-extrabold mb-2">
                  Latest Remote Jobs
                </h2>
                <p className="text-brand-body">
                  Top hand-picked opportunities from remote-first teams.
                </p>
              </div>
              <Link
                className="text-brand-primary font-bold hover:underline hidden sm:block"
                href="/jobs"
              >
                View all jobs →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-brand-body">
                  No jobs available yet. Check back soon!
                </div>
              ) : (
                featuredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-brand-border rounded-xl p-6 hover:border-brand-primary/50 transition-all card-shadow group"
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
                          <span className="text-brand-primary font-bold text-lg">
                            {job.recruiter.recruiterProfile?.companyName?.[0] ?? 'H'}
                          </span>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold rounded-full">
                        New
                      </span>
                    </div>
                    <h3 className="text-heading text-lg font-bold mb-2 group-hover:text-brand-primary transition-colors">
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
                      <span className="text-brand-accent font-bold text-sm">
                        {job.salaryMin && job.salaryMax
                          ? `$${Math.round(job.salaryMin / 1000)}k – $${Math.round(job.salaryMax / 1000)}k`
                          : 'Competitive'}
                      </span>
                      <Link
                        className="text-brand-heading font-semibold text-sm hover:translate-x-1 transition-transform"
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

        <section className="py-24 bg-white" data-purpose="categories-section">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-heading text-3xl font-extrabold mb-4">
                Browse by Category
              </h2>
              <p className="text-brand-body max-w-xl mx-auto">
                Explore high-paying remote roles across the industry&apos;s most
                in-demand categories.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-xl border border-brand-border text-center hover:border-brand-primary transition-all cursor-pointer group card-shadow">
                <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">code</span>
                </div>
                <h4 className="text-heading font-bold mb-1">Engineering</h4>
                <span className="text-gray-500 text-sm">1,240 jobs</span>
              </div>
              <div className="bg-white p-8 rounded-xl border border-brand-border text-center hover:border-brand-primary transition-all cursor-pointer group card-shadow">
                <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">palette</span>
                </div>
                <h4 className="text-heading font-bold mb-1">Design</h4>
                <span className="text-gray-500 text-sm">450 jobs</span>
              </div>
              <div className="bg-white p-8 rounded-xl border border-brand-border text-center hover:border-brand-primary transition-all cursor-pointer group card-shadow">
                <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">pie_chart</span>
                </div>
                <h4 className="text-heading font-bold mb-1">Marketing</h4>
                <span className="text-gray-500 text-sm">320 jobs</span>
              </div>
              <div className="bg-white p-8 rounded-xl border border-brand-border text-center hover:border-brand-primary transition-all cursor-pointer group card-shadow">
                <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <h4 className="text-heading font-bold mb-1">Sales</h4>
                <span className="text-gray-500 text-sm">215 jobs</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-brand-light" data-purpose="recruiters-cta">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-white rounded-3xl p-8 md:p-16 card-shadow flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <h2 className="text-heading text-4xl font-extrabold mb-6">
                  Are you hiring <br />
                  remote talent?
                </h2>
                <p className="text-brand-body text-lg mb-8 leading-relaxed">
                  Reach thousands of qualified remote professionals. Post your
                  job on Hiretivo and get applications from top-tier talent
                  worldwide.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/recruiter/register"
                    className="px-8 py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-indigo-700 transition-all btn-shadow inline-block"
                  >
                    Post your Job Today
                  </Link>
                  <Link
                    href="/recruiter/register"
                    className="px-8 py-4 border border-brand-border text-brand-heading font-bold rounded-xl hover:bg-gray-50 transition-all inline-block"
                  >
                    Talent Solutions
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 grid gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-brand-accent/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-brand-accent text-sm font-bold">
                      check
                    </span>
                  </div>
                  <div>
                    <h4 className="text-heading font-bold mb-1">
                      Targeted Reach
                    </h4>
                    <p className="text-brand-body text-sm">
                      Connect with developers, designers, and marketers who
                      prefer remote-first culture.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-brand-accent/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-brand-accent text-sm font-bold">
                      check
                    </span>
                  </div>
                  <div>
                    <h4 className="text-heading font-bold mb-1">
                      Quality Applications
                    </h4>
                    <p className="text-brand-body text-sm">
                      Our screening process ensures you get high-quality
                      candidates who match your needs.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-brand-accent/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-brand-accent text-sm font-bold">
                      check
                    </span>
                  </div>
                  <div>
                    <h4 className="text-heading font-bold mb-1">
                      Simple Management
                    </h4>
                    <p className="text-brand-body text-sm">
                      Integrated dashboard to track, filter, and communicate
                      with applicants seamlessly.
                    </p>
                  </div>
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
