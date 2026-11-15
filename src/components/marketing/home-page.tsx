import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText, Layers, Search, SlidersHorizontal } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";

import { SiteFrame } from "./site-frame";

const features = [
  { icon: FileText, title: "One profile. A resume for every opportunity.", description: "Keep your experience in one place. Create tailored resumes and cover letters from the facts you provide, then review and refine before sending." },
  { icon: Search, title: "Find roles that fit your experience.", description: "Connect a job source, explore openings, and see how a posting matches your profile—with reasons you can check." },
  { icon: Layers, title: "Keep every application in view.", description: "Track drafts, applications, interviews, and offers. Keep notes and documents together instead of searching across tabs." },
  { icon: SlidersHorizontal, title: "Choose the AI you want to use.", description: "Connect your own cloud-provider API key. Self-host to use a local model on your own hardware." },
];

export function HomePage() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-12 text-center md:px-10 md:pt-24">
        <span className="inline-flex rounded-full border border-line bg-selected px-4 py-2 text-sm font-medium text-primary-text">Free to use. Your API keys. Your next chapter.</span>
        <h1 className="mx-auto mt-7 max-w-[880px] text-4xl leading-[1.08] font-semibold tracking-tight text-primary-text sm:text-6xl lg:text-7xl">Less busywork.<br />More room for your next move.</h1>
        <p className="mx-auto mt-6 max-w-[650px] text-lg leading-relaxed text-muted">Find your fit, tailor your resume, and keep every application together. Hiretivo brings a little order to your job search—with AI you choose.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className={buttonClassName("primary", "lg")}>Start your job search <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/pricing#self-host" className={buttonClassName("secondary", "lg")}>Run it yourself</Link></div>
        <p className="mt-4 text-sm text-muted">No subscription. No credit card. External API usage may cost extra.</p>
        <figure className="mt-12 overflow-hidden rounded-card border border-line-card bg-card p-2 shadow-dialog md:mt-16">
          <Image src="/marketing/dashboard.png" alt="Hiretivo dashboard showing a sample job search, application progress, and upcoming interviews" width={1440} height={1080} priority className="h-auto w-full rounded-control" />
          <figcaption className="px-3 py-3 text-xs text-muted">A look inside Hiretivo. Sample data shown; no real applicant information.</figcaption>
        </figure>
      </section>
      <section id="how-it-works" className="border-y border-line bg-sidebar px-6 py-16 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold text-muted">A SIMPLE PLACE TO START</p><h2 className="mt-3 text-3xl font-semibold text-primary-text sm:text-4xl">From your experience to your next application.</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[["01", "Make it yours", "Create your account, add your profile or resume, and connect your own AI provider."], ["02", "Find an opportunity", "Search connected job sources or paste a posting. Review the fit and create a tailored draft."], ["03", "Stay on top of it", "Review your documents, download your PDFs, and track the application through every stage."]].map(([number, title, body]) => <li key={number}><span className="text-sm font-semibold text-muted">{number}</span><h3 className="mt-3 text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted">{body}</p></li>)}
          </ol>
        </div>
      </section>
      <section id="features" className="mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-24">
        <div className="max-w-[650px]"><p className="text-sm font-semibold text-muted">YOUR SEARCH, TOGETHER</p><h2 className="mt-3 text-3xl font-semibold text-primary-text sm:text-4xl">Spend your energy on the right opportunities.</h2></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">{features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-card border border-line-card bg-card p-7"><Icon size={24} strokeWidth={1.5} className="text-primary" aria-hidden="true" /><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-muted">{description}</p></article>)}</div>
        <div className="mt-14 grid items-center gap-8 rounded-card bg-sidebar p-6 md:grid-cols-2 md:p-10"><div><h2 className="text-3xl font-semibold text-primary-text">Your words. Your experience. A clearer story.</h2><p className="mt-4 leading-relaxed text-muted">Keep your career history in one profile, choose a resume theme, and tailor each draft to the role. You decide what goes out.</p><ul className="mt-6 space-y-3 text-sm">{["Resumes and cover letters from your profile", "A fit score with reasons to review", "Editable drafts and PDF downloads", "Application tracking from draft to offer"].map((item) => <li key={item} className="flex gap-2"><Check size={17} className="shrink-0 text-primary" aria-hidden="true" />{item}</li>)}</ul></div><Image src="/marketing/resume.png" alt="Sample resume in Hiretivo with document theme choices" width={1440} height={1080} className="h-auto w-full rounded-control border border-line-card" /></div>
      </section>
      <section className="border-t border-line bg-primary px-6 py-16 text-center text-on-primary"><h2 className="text-3xl font-semibold sm:text-4xl">Your next move starts with a little clarity.</h2><p className="mx-auto mt-4 max-w-[570px] leading-relaxed opacity-85">A free workspace for your job search. Bring your API keys, make it yours, and take it one application at a time.</p><Link href="/signup" className={buttonClassName("secondary", "lg", "mt-7")}>Create your free account <ArrowRight size={17} aria-hidden="true" /></Link></section>
    </SiteFrame>
  );
}
