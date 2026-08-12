"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import { CheckCircle2, Briefcase } from "lucide-react";
import { UserRole } from "@/constants/enums";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import { trackEvent } from "@/lib/analytics";

export function ApplyJobModal() {
  const {
    isApplyModalOpen,
    closeApplyModal,
    selectedJobId,
    selectedJobTitle,
    selectedCompanyName,
  } = useUIStore();
  const { data: session } = useSession();
  const isSeeker = session?.user?.role === UserRole.SEEKER;
  const hiretivo = useVerificationStatus();
  const queryClient = useQueryClient();

  const guardHiretivoVerified = (): boolean => {
    if (!isSeeker) return true;
    if (hiretivo.isLoading) return false;
    if (hiretivo.isVerified) return true;
    closeApplyModal();
    const msg =
      hiretivo.status === "PENDING" || hiretivo.status === "IN_REVIEW"
        ? "Verification is pending — check back soon."
        : hiretivo.status === "REJECTED"
          ? "Verification rejected. Check your email for next steps."
          : "Submit your profile for verification to apply.";
    toast.error(msg, {
      action:
        !hiretivo.status || hiretivo.status === "NOT_SUBMITTED"
          ? { label: "Start Verification", onClick: () => { window.location.href = "/settings"; } }
          : undefined,
    });
    return false;
  };

  const handleConfirmApplied = async () => {
    if (!selectedJobId) return;
    if (!guardHiretivoVerified()) return;

    closeApplyModal();

    try {
      const app = await applicationService.applyToJob({
        jobId: selectedJobId,
        coverLetter: "",
      });
      await applicationService.generateResume(app.id);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["seeker-dashboard-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
      toast.success("Application confirmed!");
      trackEvent("apply_job", {
        apply_type: "external",
        stage: "success",
        entrypoint: "modal",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit application";
      toast.error(message);
    }
  };

  return (
    <Dialog open={isApplyModalOpen} onOpenChange={closeApplyModal}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-8 sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
            <Briefcase className="h-8 w-8 text-brand-primary" />
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-brand-foreground">
            Did you apply?
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-brand-foreground-muted">
            We&apos;ve opened the company site in a new tab. Did you complete
            your application there?
          </DialogDescription>

          <div className="mt-8 w-full space-y-3">
            <Button
              type="button"
              className="w-full font-bold bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={handleConfirmApplied}
            >
              <CheckCircle2 className="h-4 w-4" />
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
