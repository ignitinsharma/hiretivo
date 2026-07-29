"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/use-ui-store";
import { useGenerationQuota } from "@/hooks/use-generation-quota";

export function AddCustomJobButton() {
  const { openAddCustomJobModal, openPaidFeatureModal } = useUIStore();
  const { data: quota } = useGenerationQuota();

  const handleClick = () => {
    if (quota && !quota.allowed) {
      openPaidFeatureModal({
        feature: "resume_generation",
        title: "No generations left",
        description: `You&apos;ve used all ${quota.limit} generations this month. Upgrade to generate more tailored resumes.`,
      });
      return;
    }
    openAddCustomJobModal();
  };

  return (
    <Button onClick={handleClick} variant="secondary" size="sm">
      <Plus className="mr-1.5 h-4 w-4" />
      Add Custom Job
    </Button>
  );
}
