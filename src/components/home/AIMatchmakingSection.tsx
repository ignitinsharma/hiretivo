import { Button } from "@/components/ui/button";

/*
 * AIMatchmakingSection
 * Renders the AI matchmaking visual breakdown section with candidate and job cards.
 * Static component with complex SVG visualization.
 */
export function AIMatchmakingSection() {
  return (
    <section
      className="grid-bg overflow-hidden bg-brand-surface/50 py-16 md:py-24"
      data-purpose="ai-matchmaking"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="lg:w-5/12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-foreground">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Smart Technology
            </div>
            <h2 className="mb-6 text-3xl font-bold leading-tight text-brand-foreground md:text-5xl">
              Visual Match Breakdown
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-brand-foreground-muted">
              We don&apos;t just give you a number. Our AI maps your DNA
              directly onto role requirements, providing total transparency
              on exactly why you&apos;re a fit.
            </p>
            <div className="mb-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white">
                  <span className="material-symbols-outlined text-brand-foreground">
                    psychology
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-brand-foreground">
                    Semantic Skill Mapping
                  </h4>
                  <p className="text-sm text-brand-foreground-muted">
                    Our engine understands that &quot;React&quot; also
                    implies expertise in &quot;Hooks&quot; and &quot;Virtual
                    DOM&quot;.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white">
                  <span className="material-symbols-outlined text-brand-foreground">
                    language
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-brand-foreground">
                    Timezone Compatibility
                  </h4>
                  <p className="text-sm text-brand-foreground-muted">
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
            className="relative flex w-full flex-col items-center gap-4 lg:block lg:min-h-[600px] lg:w-7/12"
            data-purpose="matching-visual"
          >
            <svg
              className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
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

            <div className="relative z-20 w-full max-w-sm overflow-hidden rounded-xl border border-brand-border bg-white p-5 lg:absolute lg:left-0 lg:top-0 lg:w-72">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Sarah"
                    className="h-12 w-12 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUqv2uMlfz6K-UTHWuIZ4yO069aksF84VRAFPayGhBehWmwwqMj_EGUM9BTqpi6l5Zsa4AvUOE1WMoZWSydMfP7Z1GzEHVBUYrTv2gJ8wbYtS32mCJ5lzhejdzdcC8BMhsjH88KGjc0GfLoKRMtLu_1UuStcw43bnCNJ7e2uUE3mMp1VQWI2yIHQZGshiVFbLdnWkLLgvdityHoZ2a0kEuGdcG4kzuLdbERyIhx_I_KmJDfGcAsJmkxamwzU58RHMgZ_NTVWxNonLr"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-primary">
                    <span className="material-symbols-outlined text-white text-[10px] font-bold">
                      check
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-foreground">
                    Sarah Jenkins
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-foreground-secondary">
                    Sr. Product Designer
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-brand-primary/10 bg-brand-surface/50 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-brand-foreground">
                      verified
                    </span>
                    <span
                      className="truncate text-[11px] font-bold text-foreground"
                      id="tag-skill-1"
                    >
                      Figma Expert
                    </span>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold text-brand-foreground">
                    MATCH
                  </span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-brand-primary/10 bg-brand-surface/50 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-brand-foreground">
                      history
                    </span>
                    <span
                      className="truncate text-[11px] font-bold text-foreground"
                      id="tag-skill-2"
                    >
                      8+ Yrs Exp.
                    </span>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold text-brand-foreground">
                    MATCH
                  </span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-brand-primary/10 bg-brand-surface/50 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-brand-foreground">
                      schedule
                    </span>
                    <span
                      className="truncate text-[11px] font-bold text-foreground"
                      id="tag-skill-3"
                    >
                      UTC-5 Pref.
                    </span>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold text-brand-foreground">
                    MATCH
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-30 w-full max-w-sm rounded-xl border-4 border-brand-surface bg-white p-6 text-center lg:absolute lg:left-1/2 lg:top-1/2 lg:w-64 lg:-translate-x-1/2 lg:-translate-y-1/2">
              <div className="relative mb-4 inline-block">
                <svg className="h-24 w-24 -rotate-90">
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
                  <span className="text-2xl font-bold leading-none text-brand-primary">
                    99%
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase text-brand-foreground-secondary">
                    Confidence
                  </span>
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <h5 className="text-xs font-bold text-brand-foreground">
                  Match Insight
                </h5>
                <p className="text-[10px] leading-tight text-brand-foreground-muted">
                  Sarah&apos;s focus on design systems perfectly aligns with
                  the team&apos;s upcoming Q4 roadmap.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-brand-surface p-2">
                  <div className="text-[10px] font-bold text-brand-foreground">
                    98.4%
                  </div>
                  <div className="text-[8px] font-medium text-brand-foreground-secondary">
                    Technical
                  </div>
                </div>
                <div className="rounded-lg bg-brand-surface p-2">
                  <div className="text-[10px] font-bold text-brand-foreground">
                    100%
                  </div>
                  <div className="text-[8px] font-medium text-brand-foreground-secondary">
                    Culture
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-brand-border pt-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-1.5 text-[10px] font-bold text-white">
                  <span className="material-symbols-outlined text-[12px]">
                    auto_awesome
                  </span>
                  AI Recommended
                </div>
              </div>
            </div>

            <div className="relative z-20 w-full max-w-sm overflow-hidden rounded-xl border border-brand-border bg-white p-5 lg:absolute lg:bottom-0 lg:right-0 lg:w-72">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-brand-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Company"
                    className="h-8 w-8 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBudUmVpAIfQEo5LWIcNZV-xhO3w73zs9WTYTYyYzccDahL6mdXvJpe6OivRsM6nEZZokxr8XuRpLeYDLuEANPcAgWcliP2It74EflPCYyKE5VlXuAkgsVifYR8oLEu1qGz0NkhxUaqNSyX2R41726SxZpDOVIXCpOZj3js3zZkrSLmskW12CiRdM_9QfQRBu-V7HhAQKyHG1DK5m6I4dcS0ODDJdCUmJWfyxMIfbX89Szf9m_-dJKTpsT9oTGl-GRP48pIVx8WS28i"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-foreground">
                    Senior Product Designer
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-foreground">
                    Global Scale-up
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase text-brand-foreground-secondary">
                    Requirements Breakdown
                  </p>
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center justify-between gap-3 text-[11px]">
                      <span className="min-w-0 truncate text-brand-foreground-muted">
                        Design Systems
                      </span>
                      <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-brand-surface">
                        <div className="h-full w-[95%] bg-brand-primary"></div>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-3 text-[11px]">
                      <span className="min-w-0 truncate text-brand-foreground-muted">
                        Remote Workflow
                      </span>
                      <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-brand-surface">
                        <div className="h-full w-full bg-brand-primary"></div>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-3 text-[11px]">
                      <span className="min-w-0 truncate text-brand-foreground-muted">
                        SaaS Industry
                      </span>
                      <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-brand-surface">
                        <div className="h-full w-[90%] bg-brand-primary"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3 border-t border-brand-border pt-4">
                  <span className="shrink-0 text-xs font-bold text-brand-foreground">
                    $145k – $190k
                  </span>
                  <span className="min-w-0 truncate text-[10px] font-medium text-brand-foreground-secondary">
                    Full-time • Remote
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
