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

/*
 * StepComplete
 * Final onboarding step shown after job listing is created.
 * Sized to match Steps 1–3 visual scale (text-2xl heading, max-w-xl container).
 */
export function StepComplete({ onComplete, isLoading }: StepCompleteProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex my-10 justify-center">
            <div className="relative">
              <div className="absolute inset-0 scale-125 rounded-full border border-brand-primary/10 bg-brand-primary/5" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-brand-primary/10 bg-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-primary">
                  <Check
                    className="h-6 w-6 text-brand-primary"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <span className="absolute -left-7 top-9 h-1.5 w-1.5 rounded-full bg-brand-primary" />
              <span className="absolute -right-6 top-8 h-1.5 w-1.5 rounded-full bg-brand-primary" />
              <span className="absolute -left-4 top-16 h-1.5 w-1.5 rounded-full bg-brand-success" />
              <span className="absolute right-2 -bottom-1 h-2.5 w-2.5 rotate-45 bg-brand-primary" />
              <span className="absolute -right-2 top-16 h-1.5 w-1.5 rounded-full bg-brand-primary/60" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">
            You&apos;re all set!
          </h2>
          <p className="text-muted-foreground">
            Your job listing is live and visible to verified candidates.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-brand-foreground">
            Next steps
          </h3>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onComplete}
              disabled={isLoading}
              className="group flex w-full items-center justify-between gap-4 rounded-xl border border-brand-border bg-white p-4 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-surface disabled:pointer-events-none disabled:opacity-60"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-primary/10 bg-brand-primary/5 text-brand-primary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug text-brand-foreground">
                    View your job listing
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-brand-foreground-muted">
                    See how your job appears to candidates
                  </span>
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-brand-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onComplete}
              disabled={isLoading}
              className="group flex w-full items-center justify-between gap-4 rounded-xl border border-brand-border bg-white p-4 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-surface disabled:pointer-events-none disabled:opacity-60"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-primary/10 bg-brand-primary/5 text-brand-primary">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug text-brand-foreground">
                    Browse candidate profiles
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-brand-foreground-muted">
                    Find and connect with top verified engineers
                  </span>
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-brand-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              onClick={onComplete}
              size="lg"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Setting up your dashboard..." : "Go to Dashboard"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-brand-foreground-muted">Need help?</span>
              <Link
                href={SUPPORT_URL}
                className="font-medium text-brand-primary transition-colors hover:text-brand-primary-dark"
              >
                Chat with support
              </Link>
              <MessageCircle
                className="h-4 w-4 text-brand-primary"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
