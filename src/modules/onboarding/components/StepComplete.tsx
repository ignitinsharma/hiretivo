"use client";

import { ArrowRight, CheckCircle2, FileText, Users } from "lucide-react";
import Link from "next/link";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SUPPORT_URL } from "@/lib/config";

interface StepCompleteProps {
  onComplete: (destination?: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

/*
 * StepComplete
 * Final onboarding step: shows success state and lets the recruiter navigate to
 * their jobs listing, talent browse, or the main dashboard.
 */
export function StepComplete({ onComplete, isLoading, error }: StepCompleteProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span className="text-sm text-muted-foreground">First job listing</span>
        </div>
      </div>

      <div className="space-y-2 mt-6">
        <h3 className="text-sm font-medium text-foreground text-left">Next steps</h3>
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onComplete("/recruiter/jobs")}
            disabled={isLoading}
            className="w-full justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">View your job listing</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onComplete("/recruiter/talent")}
            disabled={isLoading}
            className="w-full justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Browse candidate profiles</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mt-4">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        type="button"
        onClick={() => onComplete()}
        size="lg"
        variant="primary"
        className="w-full mt-6"
        loading={isLoading}
        loadingText="Setting up your dashboard..."
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-3">
        Need help?{" "}
        <Link href={SUPPORT_URL} className="text-primary hover:underline">
          Chat with support
        </Link>
      </p>
    </div>
  );
}
