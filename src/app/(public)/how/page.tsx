import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowRight,
  Check,
  Code,
  Globe,
  Lightbulb,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "How It Works",
  description: "See how Hiretivo's skills-based matching connects job seekers with their ideal remote roles.",
  path: "/how",
});

export default function HowPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      <main>
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-gray-100 text-black text-sm font-bold mb-8 px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              Skills-based matching
            </Badge>
            <h1 className="text-foreground text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
              How Hiretivo <br />
              <span className="text-black">Works</span>
            </h1>
            <p className="text-slate-600 text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
              We connect skilled professionals with remote opportunities using
              AI-powered matching. No more endless applications — get matched
              based on what you actually know.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                asChild
              >
                <Link href="/register">
                  <span>
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 inline" />
                  </span>
                </Link>
              </Button>
              <Button
                variant="default"
                size="lg"
                asChild
              >
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-5/12">
                <Badge className="bg-gray-50 text-black text-xs font-bold uppercase tracking-wider mb-6 px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" />
                  Smart Technology
                </Badge>
                <h2 className="text-foreground text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                  AI-Powered Skill Matching
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  Our matching algorithm goes beyond keywords. We understand
                  your skills, experience, and preferences to connect you with
                  roles where you&apos;ll truly thrive.
                </p>
                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Code className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">
                        Semantic Skill Mapping
                      </h4>
                      <p className="text-sm text-slate-600">
                        Our engine understands that &quot;React&quot; also implies
                        expertise in &quot;Hooks&quot; and &quot;Virtual DOM&quot;.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">
                        Timezone Compatibility
                      </h4>
                      <p className="text-sm text-slate-600">
                        Calculated overlap based on your preference for async
                        vs. sync communication.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">
                        Experience Match
                      </h4>
                      <p className="text-sm text-slate-600">
                        Your years of experience matched against role
                        requirements for perfect alignment.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="primary" className="px-8 py-4" asChild>
                  <Link href="/get-matched">
                    <span>
                      Get Matched Now
                      <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform inline" />
                    </span>
                  </Link>
                </Button>
              </div>
              <div className="lg:w-7/12">
                <Card className="border-slate-200 p-6">
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">
                          S
                        </div>
                        <div className="flex-1">
                          <h4 className="text-foreground font-extrabold text-sm">
                            Sarah Jenkins
                          </h4>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                            Sr. Product Designer
                          </p>
                        </div>
                        <Badge className="bg-gray-100 text-black text-[10px] font-bold">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold text-foreground">
                              Figma Expert
                            </span>
                          </div>
                          <span className="text-[9px] font-extrabold text-black">
                            MATCH
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold text-foreground">
                              8+ Years Exp.
                            </span>
                          </div>
                          <span className="text-[9px] font-extrabold text-black">
                            MATCH
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold text-foreground">
                              UTC-5 Preferred
                            </span>
                          </div>
                          <span className="text-[9px] font-extrabold text-black">
                            MATCH
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-white rounded-xl border-2 border-gray-100 text-center">
                        <div className="relative inline-block mb-4">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              fill="transparent"
                              r="40"
                              stroke="#f3f4f6"
                              strokeWidth="8"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              fill="transparent"
                              r="40"
                              stroke="#000000"
                              strokeDasharray="251.2"
                              strokeDashoffset="2.5"
                              strokeWidth="8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-black leading-none">
                              99%
                            </span>
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-tighter mt-0.5">
                              Match
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-100 p-2 rounded-lg">
                            <div className="text-[10px] font-bold text-black">
                              98.4%
                            </div>
                            <div className="text-[8px] font-medium text-slate-400">
                              Technical
                            </div>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-lg">
                            <div className="text-[10px] font-bold text-black">
                              100%
                            </div>
                            <div className="text-[8px] font-medium text-slate-400">
                              Culture
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-y border-slate-200 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-black text-4xl font-extrabold mb-2">
                  2,400+
                </div>
                <div className="text-slate-600 font-medium uppercase tracking-wider text-sm">
                  Active Jobs
                </div>
              </div>
              <div>
                <div className="text-black text-4xl font-extrabold mb-2">
                  840
                </div>
                <div className="text-slate-600 font-medium uppercase tracking-wider text-sm">
                  Companies Hiring
                </div>
              </div>
              <div>
                <div className="text-black text-4xl font-extrabold mb-2">
                  12,000+
                </div>
                <div className="text-slate-600 font-medium uppercase tracking-wider text-sm">
                  Talents Hired
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <Badge className="bg-gray-100 text-black text-sm font-bold mb-4">
                Simple Process
              </Badge>
              <h2 className="text-foreground text-4xl font-extrabold mb-4">
                How to Get Started
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                Get matched with your perfect remote role in four simple steps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-foreground text-xl font-bold mb-3">
                  Create Your Profile
                </h3>
                <p className="text-slate-600 text-sm">
                  Add your skills, experience, and work preferences. Our AI
                  analyzes your unique background.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-foreground text-xl font-bold mb-3">
                  Get Matched
                </h3>
                <p className="text-slate-600 text-sm">
                  Our algorithm calculates your match score with open roles
                  based on skill alignment.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-foreground text-xl font-bold mb-3">
                  Apply Confidently
                </h3>
                <p className="text-slate-600 text-sm">
                  Review your matches and apply to roles where you&apos;re a
                  strong fit. No spray-and-pray.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-6">
                  4
                </div>
                <h3 className="text-foreground text-xl font-bold mb-3">
                  Land Your Role
                </h3>
                <p className="text-slate-600 text-sm">
                  Connect with hiring managers and start your remote career journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-white rounded-xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <Badge className="bg-gray-100 text-black text-sm font-bold mb-4">
                  For Recruiters
                </Badge>
                <h2 className="text-foreground text-4xl font-extrabold mb-6">
                  Hiring remote talent?
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  Reach thousands of qualified remote professionals. Post your
                  job on Hiretivo and get applications from top-tier talent
                  worldwide.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="primary"
                    className="px-8 py-4"
                    asChild
                  >
                    <Link href="/recruiter/post-job">Post a Job Today</Link>
                  </Button>
                  <Button
                    variant="default"
                    className="px-8 py-4"
                    asChild
                  >
                    <Link href="/recruiter/talent-search">Talent Solutions</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold mb-1">
                      Targeted Reach
                    </h4>
                    <p className="text-slate-600 text-sm">
                      Connect with developers, designers, and marketers who
                      prefer remote-first culture.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold mb-1">
                      Quality Matches
                    </h4>
                    <p className="text-slate-600 text-sm">
                      Our screening process ensures you get high-quality
                      candidates who match your needs.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold mb-1">
                      Simple Management
                    </h4>
                    <p className="text-slate-600 text-sm">
                      Integrated dashboard to track, filter, and communicate
                      with applicants seamlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Lightbulb className="w-12 h-12 text-black mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Ready to find your next remote role?
            </h2>
            <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
              Join thousands of professionals who found their perfect remote
              opportunity through skills-based matching.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                variant="primary"
                asChild
              >
                <Link href="/register">Create Free Profile</Link>
              </Button>
              <Button
                size="lg"
                variant="default"
                asChild
              >
                <Link href="/browse">Browse Jobs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
