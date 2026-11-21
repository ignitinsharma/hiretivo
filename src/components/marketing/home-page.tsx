import Link from "next/link";
import { ArrowRight, Check, FileText, Layers, Search, SlidersHorizontal } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";

import { dockerSetupUrl, repositoryUrl, sourceZipUrl } from "./project-links";
import { SiteFrame } from "./site-frame";

const features = [
  { icon: FileText, title: "One profile. A resume for every opportunity.", description: "Keep your experience in one place. Create tailored resumes and cover letters from the facts you provide, then review and refine before sending." },
  { icon: Search, title: "Find roles that fit your experience.", description: "Connect a job source, explore openings, and see how a posting matches your profile—with reasons you can check." },
  { icon: Layers, title: "Keep every application in view.", description: "Track drafts, applications, interviews, and offers. Keep notes and documents together instead of searching across tabs." },
  { icon: SlidersHorizontal, title: "Choose the AI you want to use.", description: "Connect your own cloud-provider API key or run a local model on your own hardware." },
];

export function HomePage() {
  return (
    <SiteFrame selfHosted>
      <section data-home-hero className="px-4 pb-8 text-center sm:px-8 md:px-10">
        <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm font-medium text-stone-200">Free and open source</span>
        <h1 className="mx-auto mt-5 max-w-[1050px] text-4xl leading-[1.08] font-semibold tracking-tight text-stone-50 sm:text-5xl lg:text-[64px]">Less busywork.<br /><span className="text-balance text-stone-300">More room for your next move.</span></h1>
        <p className="mx-auto mt-5 max-w-[650px] text-lg leading-relaxed text-stone-300">Find your fit, tailor your resume, and keep every application together. Hiretivo runs on your own machine with the AI provider you choose.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={dockerSetupUrl} className={buttonClassName("primary", "lg")}>Set up with Docker <ArrowRight size={17} aria-hidden="true" /></a>
          <a href={repositoryUrl} className={buttonClassName("secondary", "lg", "home-hero-link")}>View on GitHub</a>
          <a href={sourceZipUrl} className={buttonClassName("secondary", "lg", "home-hero-link")}>Download ZIP</a>
        </div>
        <p className="mt-3 text-sm text-stone-300">External API usage may cost extra.</p>
        <Link href="/features" className="mt-4 inline-block text-stone-200 underline underline-offset-4 hover:text-white sm:hidden">Explore features</Link>
        <figure className="mx-auto mt-8 max-w-[1200px] overflow-hidden home-dashboard rounded-[20px] border border-white/20 bg-[#242424] p-2 shadow-lg md:mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- The static site serves pre-optimized WebP directly. */}
          <img src="/marketing/dashboard.webp" alt="Hiretivo dashboard showing fictional application totals, recent roles, and their statuses" width={2880} height={1800} fetchPriority="high" className="h-auto w-full rounded-control" />
          <figcaption className="px-3 py-3 text-xs text-stone-300">Hiretivo dashboard with fictional demo data.</figcaption>
        </figure>
      </section>
      <section id="how-it-works" className="border-y border-line bg-sidebar px-6 py-16 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold text-muted">A SIMPLE PLACE TO START</p><h2 className="mt-3 text-3xl font-semibold text-neutral-900 sm:text-4xl">From your experience to your next application.</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[["01", "Make it yours", "Set up Hiretivo, add your profile or resume, and connect your own AI provider."], ["02", "Find an opportunity", "Search connected job sources or paste a posting. Review the fit and create a tailored draft."], ["03", "Stay on top of it", "Review your documents, download your PDFs, and track the application through every stage."]].map(([number, title, body]) => <li key={number}><span className="text-sm font-semibold text-muted">{number}</span><h3 className="mt-3 text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted">{body}</p></li>)}
          </ol>
        </div>
      </section>
      <section id="features" className="mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-24">
        <div className="max-w-[650px]"><p className="text-sm font-semibold text-muted">YOUR SEARCH, TOGETHER</p><h2 className="mt-3 text-3xl font-semibold text-neutral-900 sm:text-4xl">Spend your energy on the right opportunities.</h2></div>
        <Link href="/features" className={buttonClassName("secondary", "md", "mt-5")}>See how Hiretivo works <ArrowRight size={15} aria-hidden="true" /></Link>
        <div className="mt-10 grid gap-5 md:grid-cols-2">{features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-[20px] border border-line-card bg-card p-7"><Icon size={24} strokeWidth={1.5} className="text-primary" aria-hidden="true" /><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted">{description}</p></article>)}</div>
        <div className="mt-14 grid items-center gap-8 rounded-[20px] bg-sidebar p-6 md:grid-cols-2 md:p-10"><div><h2 className="text-3xl font-semibold text-neutral-900">Your words. Your experience. A clearer story.</h2><p className="mt-4 leading-relaxed text-muted">Keep your career history in one profile, choose a resume theme, and tailor each draft to the role. You decide what goes out.</p><ul className="mt-6 space-y-3 text-sm">{["Resumes and cover letters from your profile", "A fit score with reasons to review", "Editable drafts and PDF downloads", "Application tracking from draft to offer"].map((item) => <li key={item} className="flex gap-2"><Check size={17} className="shrink-0 text-primary" aria-hidden="true" />{item}</li>)}</ul></div>
          {/* eslint-disable-next-line @next/next/no-img-element -- The static site serves pre-optimized WebP directly. */}
          <img src="/marketing/resume.webp" alt="Hiretivo Resume workspace with theme choices alongside a fictional candidate’s resume preview" width={2880} height={1800} loading="lazy" className="h-auto w-full rounded-control border border-line-card" />
        </div>
      </section>
      <section className="border-t border-stone-200 bg-[#f8f7f4] px-6 py-16 text-center text-neutral-900"><h2 className="text-3xl font-semibold sm:text-4xl">Your next move starts with a little clarity.</h2><p className="mx-auto mt-4 max-w-[570px] leading-relaxed text-neutral-600">Run Hiretivo on your own machine and manage your job search in one place.</p><a href={dockerSetupUrl} className={buttonClassName("primary", "lg", "mt-7")}>Set up with Docker <ArrowRight size={17} aria-hidden="true" /></a></section>
    </SiteFrame>
  );
}
