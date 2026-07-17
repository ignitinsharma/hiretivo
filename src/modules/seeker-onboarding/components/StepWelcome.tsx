"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Hand } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SITUATION_OPTIONS } from "@/lib/validations/seeker-onboarding.schema";
import type { SeekerSituation } from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep1 } from "@/app/actions/onboarding/seeker";

const FIELD_ERROR_CLASS = "text-sm text-brand-danger";

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const {
    step1,
    userName,
    userEmail,
    setUserName,
    setName,
    setPhone,
    setLinkedinUrl,
    setGithubUrl,
    setPortfolioUrl,
    setSituation,
  } = useSeekerOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setServerError(null);

    const newErrors: Record<string, string> = {};
    if (!step1.name.trim()) newErrors.name = "Full name is required";
    if (!step1.phone.trim()) newErrors.phone = "Phone is required";
    else if (step1.phone.trim().length < 5) newErrors.phone = "Phone must be at least 5 characters";
    if (!step1.linkedinUrl.trim()) newErrors.linkedinUrl = "LinkedIn URL is required";
    else if (!/linkedin\.com\/in\//i.test(step1.linkedinUrl)) newErrors.linkedinUrl = "Must be a LinkedIn profile URL (linkedin.com/in/...)";
    if (step1.githubUrl?.trim() && !/github\.com\//i.test(step1.githubUrl)) newErrors.githubUrl = "Must be a GitHub profile URL (github.com/...)";
    if (step1.portfolioUrl?.trim() && !/^https?:\/\//.test(step1.portfolioUrl)) newErrors.portfolioUrl = "Invalid URL";
    if (!step1.situation) newErrors.situation = "Select your current situation";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);
    const result = await saveStep1({
      name: step1.name,
      phone: step1.phone,
      linkedinUrl: step1.linkedinUrl,
      githubUrl: step1.githubUrl || null,
      portfolioUrl: step1.portfolioUrl || null,
      situation: step1.situation!,
    });
    setIsSaving(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    onNext();
  };

  const errorFor = (field: string) => errors[field] ?? null;
  const setErrorFor = (field: string) => (val: string) => setErrors((prev) => ({ ...prev, [field]: val }));

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
            <Hand className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-foreground">
            {userName ? `Welcome to Hiretivo, ${userName}!` : "Welcome to Hiretivo!"}
          </h2>
          <p className="text-brand-foreground-muted">
            Let&apos;s get started. Fill in your basic details.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-foreground">
              Full Name <span className="text-brand-danger">*</span>
            </label>
            <Input
              value={step1.name}
              onChange={(e) => { setName(e.target.value); setUserName(e.target.value.split(" ")[0]); setErrorFor("name")(""); }}
              placeholder="Your full name"
            />
            {errorFor("name") && <p className={FIELD_ERROR_CLASS}>{errorFor("name")}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-foreground">
              Email
            </label>
            <Input
              value={userEmail}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-brand-foreground-muted">
              Used for account recovery and notifications.
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-foreground">
              Phone <span className="text-brand-danger">*</span>
            </label>
            <Input
              type="tel"
              value={step1.phone}
              onChange={(e) => { setPhone(e.target.value); setErrorFor("phone")(""); }}
              placeholder="+91 98765 43210"
            />
            {errorFor("phone") && <p className={FIELD_ERROR_CLASS}>{errorFor("phone")}</p>}
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-foreground">
              LinkedIn URL <span className="text-brand-danger">*</span>
            </label>
            <Input
              type="url"
              value={step1.linkedinUrl}
              onChange={(e) => { setLinkedinUrl(e.target.value); setErrorFor("linkedinUrl")(""); }}
              placeholder="https://linkedin.com/in/your-profile"
            />
            {errorFor("linkedinUrl") && <p className={FIELD_ERROR_CLASS}>{errorFor("linkedinUrl")}</p>}
          </div>

          {/* GitHub URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-foreground">
              GitHub URL
            </label>
            <Input
              type="url"
              value={step1.githubUrl ?? ""}
              onChange={(e) => { setGithubUrl(e.target.value); setErrorFor("githubUrl")(""); }}
              placeholder="https://github.com/your-username (optional)"
            />
            {errorFor("githubUrl") && <p className={FIELD_ERROR_CLASS}>{errorFor("githubUrl")}</p>}
          </div>

          {/* Portfolio URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-foreground">
              Portfolio URL
            </label>
            <Input
              type="url"
              value={step1.portfolioUrl ?? ""}
              onChange={(e) => { setPortfolioUrl(e.target.value || null); setErrorFor("portfolioUrl")(""); }}
              placeholder="https://your-portfolio.com (optional)"
            />
            {errorFor("portfolioUrl") && <p className={FIELD_ERROR_CLASS}>{errorFor("portfolioUrl")}</p>}
          </div>

          {/* Situation */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-brand-foreground">
              What&apos;s your current situation? <span className="text-brand-danger">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SITUATION_OPTIONS.map((option) => {
                const isSelected = step1.situation === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setSituation(option.value as SeekerSituation); setErrorFor("situation")(""); }}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-28 rounded-xl border-2 p-3 text-left transition-all",
                      isSelected
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-brand-border bg-white hover:border-brand-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-base",
                        isSelected
                          ? "bg-brand-primary text-white"
                          : "bg-brand-surface",
                      )}
                    >
                      {isSelected ? (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span>{option.icon}</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className={cn("text-sm font-medium leading-snug", isSelected ? "text-brand-primary" : "text-brand-foreground")}>
                        {option.label}
                      </p>
                      <p className="text-xs leading-relaxed text-brand-foreground-muted">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errorFor("situation") && <p className={FIELD_ERROR_CLASS}>{errorFor("situation")}</p>}
          </div>

          {serverError && (
            <p className="text-sm text-brand-danger text-center">{serverError}</p>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full"
              loading={isSaving}
              loadingText="Saving..."
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
