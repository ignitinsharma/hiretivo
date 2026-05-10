import { Button } from "@/components/ui/button";

/*
 * AIMatchmakingSection
 * Renders the AI matchmaking visual breakdown section with candidate and job cards.
 * Static component with complex SVG visualization.
 */
export function AIMatchmakingSection() {
  return (
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
            <h2 className="text-foreground mb-6 text-3xl font-bold leading-tight md:text-5xl">
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
  );
}