import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";

export function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main data-hiretivo-onboarding className="grid min-h-screen bg-surface lg:grid-cols-2">
    <div className="flex items-center justify-center px-6 py-12"><div className="flex w-full max-w-[400px] flex-col gap-8">
      <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-primary-text"><BrandMark className="size-10" />Hiretivo</Link>
      <div className="space-y-2"><h1 className="text-title text-primary-text">{title}</h1><p className="text-sm leading-relaxed text-muted">{description}</p></div>
      {children}
      <Link href="/pricing" className="text-meta text-muted underline underline-offset-4">Free to use. Bring your own API keys.</Link>
    </div></div>
    <div className="hidden flex-col justify-center gap-8 bg-canvas px-16 py-20 lg:flex"><BrandMark className="size-24" /><p className="max-w-lg text-4xl font-semibold leading-tight text-primary-text">A little more clarity.<br />A lot less job-search chaos.</p><p className="max-w-md text-muted">Keep your career story, tailored documents, and applications together. Choose the AI provider that works for you.</p></div>
  </main>;
}
