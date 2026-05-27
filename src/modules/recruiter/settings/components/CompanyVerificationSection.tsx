"use client";

/*
 * CompanyVerificationSection
 * Renders the Company Verification card inside the recruiter settings page.
 * Shows one of three states based on the recruiter's verification data:
 *   1. VERIFIED — green badge + verified date, no action button.
 *   2. PENDING  — amber badge + explanatory text when a Level 2 submission exists.
 *   3. NOT VERIFIED — gray badge + action surface:
 *        - Corporate email → "Verify company" button (Level 1 auto-check).
 *        - Freemail        → LinkedIn URL + work-email form (Level 2 manual review).
 * @param settings - RecruiterSettingsData containing the 4 verification fields + email
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, Clock, ShieldQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFreemailDomain } from "@/lib/company-verification";
import {
  Level2SubmitSchema,
  type Level2SubmitInput,
} from "@/lib/validations/company-verification.schema";
import { recruiterService } from "@/services/recruiter.service";
import type { RecruiterSettingsData } from "@/services/recruiter.service";

interface CompanyVerificationSectionProps {
  settings: RecruiterSettingsData;
}

/*
 * VerifiedBadge
 * Green badge shown when companyVerified is true.
 */
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-success/10 px-2.5 py-1 text-xs font-semibold text-brand-success">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Verified Company
    </span>
  );
}

/*
 * PendingBadge
 * Amber badge shown when a Level 2 submission is under admin review.
 */
function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock className="h-3.5 w-3.5" />
      Under review
    </span>
  );
}

/*
 * UnverifiedBadge
 * Gray badge shown when the recruiter has not yet verified their company.
 */
function UnverifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand-foreground-secondary">
      <ShieldQuestion className="h-3.5 w-3.5" />
      Unverified
    </span>
  );
}

export function CompanyVerificationSection({
  settings,
}: CompanyVerificationSectionProps) {
  const queryClient = useQueryClient();
  const isFreemail = isFreemailDomain(settings.email);

  // Local state to show Level 1 result messages (no_website / mismatch)
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const form = useForm<Level2SubmitInput>({
    resolver: zodResolver(Level2SubmitSchema),
    defaultValues: { companyLinkedInUrl: "", companyWorkEmail: "" },
  });

  const verifyMutation = useMutation({
    mutationFn: (body?: Level2SubmitInput) =>
      recruiterService.verifyCompany(body),
    onSuccess: async (response) => {
      // The route returns the object directly (no data wrapper at runtime):
      // Level 1: { level: 1, verified: true } | { level: 1, alreadyVerified: true }
      // Level 1 fail: { level: 1, no_website: true, message } | { level: 1, mismatch: true, message }
      // Level 2: { level: 2, pending: true }
      const raw = response as unknown as Record<string, unknown>;

      if (raw.verified || raw.alreadyVerified) {
        toast.success("Company verified successfully.");
      } else if (raw.pending) {
        toast.success("Verification request submitted. Admin will review shortly.");
      } else if (typeof raw.message === "string") {
        // Level 1 no_website or mismatch — show message, don't treat as error
        setResultMessage(raw.message);
        toast.info(raw.message);
      }

      await queryClient.invalidateQueries({ queryKey: ["recruiter-settings"] });
    },
    onError: () =>
      toast.error("Verification request failed. Please try again."),
  });

  const handleLevel2Submit = (values: Level2SubmitInput): void => {
    setResultMessage(null);
    verifyMutation.mutate(values);
  };

  const handleLevel1Click = (): void => {
    setResultMessage(null);
    verifyMutation.mutate(undefined);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5">
        <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-foreground">
          Company verification
        </h3>
        <p className="mt-1 text-sm text-brand-foreground-muted">
          Verified companies get a trust badge on job listings and unlock
          priority placement.
        </p>
      </div>

      {/* STATE 1: VERIFIED */}
      {settings.companyVerified && (
        <div className="space-y-2">
          <VerifiedBadge />
          {settings.companyVerifiedAt && (
            <p className="text-sm text-brand-foreground-muted">
              Verified on{" "}
              {format(new Date(settings.companyVerifiedAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
      )}

      {/* STATE 2: PENDING — Level 2 submission exists, awaiting admin */}
      {!settings.companyVerified && settings.companyWorkEmail && (
        <div className="space-y-2">
          <PendingBadge />
          <p className="text-sm text-brand-foreground-muted">
            Your verification request is under admin review. We&apos;ll email
            you when it&apos;s decided.
          </p>
        </div>
      )}

      {/* STATE 3: NOT VERIFIED */}
      {!settings.companyVerified && !settings.companyWorkEmail && (
        <div className="space-y-4">
          <UnverifiedBadge />

          {/* Level 1: corporate email auto-check */}
          {!isFreemail && (
            <div className="space-y-3">
              <p className="text-sm text-brand-foreground-muted">
                Auto-verify by matching your email domain to your company
                website.
              </p>
              {resultMessage && (
                <p className="rounded-lg border border-gray-200 bg-brand-surface px-3 py-2 text-sm text-brand-foreground-muted">
                  {resultMessage}
                </p>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={verifyMutation.isPending}
                loadingText="Checking..."
                onClick={handleLevel1Click}
              >
                Verify company
              </Button>
            </div>
          )}

          {/* Level 2: freemail — manual LinkedIn + work-email form */}
          {isFreemail && (
            <form
              onSubmit={form.handleSubmit(handleLevel2Submit)}
              className="space-y-4"
            >
              <p className="text-sm text-brand-foreground-muted">
                Your email provider doesn&apos;t allow automatic domain
                verification. Provide your company LinkedIn URL and a work email
                for manual review.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyLinkedInUrl">
                    Company LinkedIn URL
                  </Label>
                  <Input
                    id="companyLinkedInUrl"
                    placeholder="https://linkedin.com/company/acme"
                    {...form.register("companyLinkedInUrl")}
                  />
                  {form.formState.errors.companyLinkedInUrl && (
                    <p className="text-xs text-brand-danger">
                      {form.formState.errors.companyLinkedInUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWorkEmail">Work email</Label>
                  <Input
                    id="companyWorkEmail"
                    type="email"
                    placeholder="you@company.com"
                    {...form.register("companyWorkEmail")}
                  />
                  {form.formState.errors.companyWorkEmail && (
                    <p className="text-xs text-brand-danger">
                      {form.formState.errors.companyWorkEmail.message}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={verifyMutation.isPending}
                loadingText="Submitting..."
              >
                Submit for review
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
