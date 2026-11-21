import { ArrowRight } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";

import { dockerSetupUrl, repositoryUrl } from "./project-links";
import { SiteFrame } from "./site-frame";

const workflow = [
  {
    id: "profile",
    title: "Build your career profile",
    description: "Import a resume or add your experience, education, skills, and projects yourself. Hiretivo uses this profile when drafting documents, so you can keep your career history in one place.",
    screenshot: "profile.webp",
    alt: "Profile editor with sections for a fictional candidate’s career history and a profile strength meter",
    width: 2880,
  },
  {
    id: "find-jobs",
    title: "Find roles worth applying for",
    description: "Connect a job source, browse openings, and review why a role matches your experience. You can also explore startups or bring a job posting you found elsewhere.",
    screenshot: "find-jobs.webp",
    alt: "Find Jobs workspace showing sample search results alongside the selected job posting",
    width: 2880,
  },
  {
    id: "tailoring",
    title: "Review the job before you tailor",
    description: "Start an application from a search result or paste a link or job description. Check the extracted details, edit them if needed, and choose a cover-letter tone before starting a draft.",
    screenshot: "new-application.webp",
    alt: "New application dialog with a sample job description ready for review and cover-letter tone options",
    width: 2880,
  },
  {
    id: "documents",
    title: "Draft and refine application documents",
    description: "Generate a tailored resume and cover letter using your profile. Review the draft, refine it in chat, and download the PDFs when you’re ready.",
    screenshot: "application.webp",
    alt: "A fictional job application with its tailored resume and a chat for refining the draft",
    width: 2880,
  },
  {
    id: "resume",
    title: "Keep a base resume ready",
    description: "Use the Resume workspace to maintain a general-purpose resume. Choose a theme, customize the layout and sections, and preview the result before exporting a PDF.",
    screenshot: "resume.webp",
    alt: "Resume workspace with design themes beside a fictional candidate’s resume preview",
    width: 2880,
  },
  {
    id: "tracking",
    title: "Track applications and follow-ups",
    description: "Move applications through stages on the board or review them in a table. Keep notes, documents, and interview dates on the application, then check the dashboard for recent activity and progress.",
    screenshot: "applications.webp",
    alt: "Applications board showing fictional roles grouped by status from draft through offer",
    width: 3360,
  },
];

export const featureScreenshots = workflow.map(({ screenshot }) => screenshot);

export function FeaturesPage() {
  return (
    <SiteFrame selfHosted featuresPage>
      <section data-home-hero className="px-5 pb-12 text-center sm:px-8 sm:pb-16">
        <h1 className="mx-auto max-w-[820px] text-balance text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">How Hiretivo works</h1>
        <p className="mx-auto mt-5 max-w-[660px] text-lg leading-relaxed text-stone-300">
          Hiretivo is a self-hosted workspace for finding jobs, tailoring resumes and cover letters, and tracking applications. Follow a job search from profile setup to interview. All screenshots use fictional demo data.
        </p>
        <nav aria-label="Jump to a feature" className="mt-7 flex flex-wrap justify-center gap-2">
          {[
            ["profile", "Profile"], ["find-jobs", "Job search"], ["tailoring", "Tailoring"],
            ["documents", "Documents"], ["resume", "Base resume"], ["tracking", "Tracking"], ["settings", "Settings"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-sm text-stone-100 hover:bg-white/15 hover:text-white">{label}</a>
          ))}
        </nav>
      </section>
      <div className="mx-auto max-w-[1440px] px-3 pb-12 sm:px-8">
        {workflow.map(({ id, title, description, screenshot, alt, width }, index) => (
          <section key={id} id={id} className={`grid items-center gap-6 border-b border-stone-300/70 py-10 sm:py-14 lg:gap-12 lg:py-16 ${index % 2 === 0 ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]" : "lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]"}`}>
            <div className={index % 2 === 0 ? "lg:col-start-2 lg:row-start-1" : undefined}>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{title}</h2>
              <p className="mt-3 lg:max-w-[38ch] leading-relaxed text-muted">{description}</p>
            </div>
            <a href={`/marketing/${screenshot}`} aria-label={`Open full-resolution screenshot: ${title}`} className={`block cursor-zoom-in rounded-xl shadow-sm sm:shadow-md ${index % 2 === 0 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- The static site serves pre-optimized WebP directly. */}
              <img src={`/marketing/${screenshot}`} alt={alt} width={width} height={1800} loading={index === 0 ? "eager" : "lazy"} className="block h-auto w-full rounded-xl" />
            </a>
          </section>
        ))}
        <section id="settings" className="mt-10 rounded-[20px] border border-line bg-white p-5 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">Choose what Hiretivo connects to</h2>
          <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
            <div><dt className="font-semibold">AI provider</dt><dd className="mt-2 leading-relaxed text-muted">Bring a supported provider’s API key or run a local model on your own hardware.</dd></div>
            <div><dt className="font-semibold">Optional integrations</dt><dd className="mt-2 leading-relaxed text-muted">Connect Gmail and Google Calendar, or authorize an MCP client when you need it.</dd></div>
            <div><dt className="font-semibold">Your data</dt><dd className="mt-2 leading-relaxed text-muted">Export application data and manage what’s stored from Settings.</dd></div>
          </dl>
        </section>
      </div>
      <section className="px-5 pb-14 text-center">
        <h2 className="text-2xl font-semibold text-neutral-900">Try it on your own machine</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={dockerSetupUrl} className={buttonClassName("primary", "lg")}>Set up with Docker <ArrowRight size={17} aria-hidden="true" /></a>
          <a href={repositoryUrl} className={buttonClassName("secondary", "lg")}>View on GitHub</a>
        </div>
      </section>
    </SiteFrame>
  );
}
