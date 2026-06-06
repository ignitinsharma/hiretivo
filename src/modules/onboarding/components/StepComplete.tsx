"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  MessageCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SUPPORT_URL } from "@/lib/config";

interface StepCompleteProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function StepComplete({ onComplete, isLoading }: StepCompleteProps) {
  return (
    <section className="min-h-screen bg-brand-surface px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-125 rounded-full border border-brand-primary/10 bg-brand-primary/5" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-brand-primary/10 bg-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-primary">
                <Check className="h-6 w-6 text-brand-primary" aria-hidden="true" />
              </div>
            </div>

            <span className="absolute -left-7 top-9 h-1.5 w-1.5 rounded-full bg-brand-primary" />
            <span className="absolute -right-6 top-8 h-1.5 w-1.5 rounded-full bg-brand-primary" />
            <span className="absolute -left-4 top-16 h-1.5 w-1.5 rounded-full bg-brand-success" />
            <span className="absolute right-2 -bottom-1 h-2.5 w-2.5 rotate-45 bg-brand-primary" />
            <span className="absolute -right-2 top-16 h-1.5 w-1.5 rounded-full bg-brand-primary/60" />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 text-brand-foreground-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-primary text-brand-primary">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-base font-medium md:text-lg">First job listing</span>
          </div>
        </div>

        <div className="mt-3 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            You&apos;re all set!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
            Your job listing is live and visible to verified candidates.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-foreground md:text-2xl">
            Next steps
          </h2>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onComplete}
              disabled={isLoading}
              className="group flex w-full items-center justify-between gap-4 rounded-xl border border-brand-border bg-white p-4 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-surface disabled:pointer-events-none disabled:opacity-60 md:p-5"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-primary/10 bg-brand-primary/5 text-brand-primary">
                  <FileText className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug text-brand-foreground md:text-xl">
                    View your job listing
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-brand-foreground-muted md:text-base">
                    See how your job appears to candidates
                  </span>
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-brand-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onComplete}
              disabled={isLoading}
              className="group flex w-full items-center justify-between gap-4 rounded-xl border border-brand-border bg-white p-4 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-surface disabled:pointer-events-none disabled:opacity-60 md:p-5"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-primary/10 bg-brand-primary/5 text-brand-primary">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug text-brand-foreground md:text-xl">
                    Browse candidate profiles
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-brand-foreground-muted md:text-base">
                    Find and connect with top verified engineers
                  </span>
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-brand-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          </div>

          <Button
            type="button"
            onClick={onComplete}
            size="lg"
            variant="primary"
            className="mt-6 h-12 w-full rounded-lg text-base font-semibold [&_svg]:size-5 md:h-14 md:text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Setting up your dashboard..." : "Go to Dashboard"}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm md:text-base">
            <span className="text-brand-foreground-muted">Need help?</span>
            <Link
              href={SUPPORT_URL}
              className="font-medium text-brand-primary transition-colors hover:text-brand-primary-dark"
            >
              Chat with support
            </Link>
            <MessageCircle className="h-4 w-4 text-brand-primary" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
