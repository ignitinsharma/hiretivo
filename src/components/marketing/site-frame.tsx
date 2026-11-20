import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { buttonClassName } from "@/components/ui/button";

import { dockerSetupUrl, repositoryUrl, sourceZipUrl } from "./project-links";

export function SiteFrame({ children, hosted = true, selfHosted = false }: {
  children: ReactNode;
  hosted?: boolean;
  selfHosted?: boolean;
}) {
  return (
    <div data-hiretivo-home={selfHosted ? "" : undefined} className="min-h-screen bg-paper text-ink">
      <a href="#content" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to content</a>
      <header className="border-b border-line bg-surface">
        <nav aria-label="Website" className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
          <Link href="/" aria-label="Hiretivo home" className="flex items-center gap-2.5 text-xl font-semibold text-primary-text"><BrandMark className="size-9" />Hiretivo</Link>
          {selfHosted ? (
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <a href="#features" className="hidden hover:underline sm:block">Features</a>
              <a href={repositoryUrl} className="hover:underline">View on GitHub</a>
              <a href={dockerSetupUrl} className={buttonClassName("primary", "md")}>Set up with Docker</a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <Link href="/#features" className="hidden hover:underline sm:block">Features</Link>
              <Link href="/pricing" className="hover:underline">Pricing & setup</Link>
              <Link href="/login" className="hover:underline">Log in</Link>
              {hosted && <Link href="/signup" className={buttonClassName("primary", "md")}>Get started free</Link>}
            </div>
          )}
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer className="border-t border-line bg-sidebar">
        <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-6 px-6 py-8 text-sm text-muted md:px-10">
          <p>Hiretivo · A calmer way to manage your job search.</p>
          {selfHosted ? (
            <div className="flex flex-wrap gap-5">
              <a href={dockerSetupUrl}>Set up with Docker</a>
              <a href={repositoryUrl}>View on GitHub</a>
              <a href={sourceZipUrl}>Download ZIP</a>
            </div>
          ) : (
            <div className="flex flex-wrap gap-5"><Link href="/pricing">Free pricing</Link><Link href="/pricing#self-host">Self-hosting guide</Link><Link href="/pricing#privacy">Your data</Link></div>
          )}
        </div>
      </footer>
    </div>
  );
}
