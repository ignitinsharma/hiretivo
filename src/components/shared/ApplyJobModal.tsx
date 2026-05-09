"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import { ExternalLink, CheckCircle2, Briefcase } from "lucide-react";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";
import { trackEvent } from "@/lib/analytics";

const RESUME_REQUIRED_ERROR =
  "Upload your resume in Settings before applying. Go to /seeker/settings to continue.";

export function ApplyJobModal() {
  const {
    isApplyModalOpen,
    closeApplyModal,
    selectedJobId,
    selectedJobTitle,
    selectedCompanyName,
    selectedExternalApplyUrl,
    showExternalConfirm,
  } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();
  const { openEmailVerificationModal } = useUIStore();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Failed to submit application";
    if (message === RESUME_REQUIRED_ERROR) {
      toast.error("Resume required before applying.", {
        action: {
          label: "Upload Resume",
          onClick: () => {
            window.location.href = "/seeker/settings";
          },
        },
      });
      return;
    }
    toast.error(message);
  };

  const handleExternalRedirect = () => {
    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    if (selectedExternalApplyUrl) {
      trackEvent("apply_job", {
        apply_type: "external",
        stage: "attempt",
        entrypoint: "modal",
      });
      window.open(selectedExternalApplyUrl, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (isApplyModalOpen) {
      setCoverLetter("");
    }
  }, [selectedJobId, isApplyModalOpen]);

  const handleConfirmApplied = async () => {
    if (!selectedJobId) return;
    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    closeApplyModal();

    try {
      await applicationService.applyToJob({
        jobId: selectedJobId,
        coverLetter: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["seeker-dashboard"] });
      toast.success("Application confirmed!");
      trackEvent("apply_job", {
        apply_type: "external",
        stage: "success",
        entrypoint: "modal",
      });
    } catch (error) {
      handleApplyError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;
    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    setIsSubmitting(true);
    try {
      await applicationService.applyToJob({
        jobId: selectedJobId,
        coverLetter,
      });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["seeker-dashboard"] });
      toast.success("Application submitted!");
      trackEvent("apply_job", {
        apply_type: "internal",
        stage: "success",
        entrypoint: "modal",
      });
      setCoverLetter("");
      closeApplyModal();
    } catch (error) {
      handleApplyError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showExternalConfirm) {
    return (
      <Dialog open={isApplyModalOpen} onOpenChange={closeApplyModal}>
        <DialogContent className="sm:max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
              <Briefcase className="h-8 w-8 text-brand-primary" />
            </div>

            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
              Did you apply?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-500">
              Let us know so we can help you track your application and refine
              future recommendations for you!
            </DialogDescription>

            <div className="mt-8 w-full space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full font-bold"
                onClick={handleExternalRedirect}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Continue to company site
              </Button>
              <Button
                type="button"
                className="w-full font-bold bg-brand-primary text-white hover:bg-brand-primary/90"
                onClick={handleConfirmApplied}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Yes, I applied!
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full font-bold"
                onClick={closeApplyModal}
              >
                No, I didn&apos;t apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isApplyModalOpen} onOpenChange={closeApplyModal}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pt-2 pb-4">
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
            Apply for {selectedJobTitle || "this position"}
          </DialogTitle>
          <p className="text-slate-500 font-medium mt-1">
            at {selectedCompanyName || "this company"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end mb-2">
              <Label
                htmlFor="interest"
                className="text-sm font-bold text-slate-900"
              >
                What interests you about working for this company?
              </Label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Optional
              </span>
            </div>
            <Textarea
              id="interest"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="I've been following this company's journey..."
              className="min-h-[150px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto font-bold"
              onClick={closeApplyModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto font-bold bg-primary text-white hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
