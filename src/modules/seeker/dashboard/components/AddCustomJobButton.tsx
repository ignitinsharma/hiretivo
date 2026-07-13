"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/use-ui-store";

export function AddCustomJobButton() {
  const { openAddCustomJobModal } = useUIStore();

  return (
    <Button onClick={openAddCustomJobModal} variant="secondary" size="sm">
      <Plus className="mr-1.5 h-4 w-4" />
      Add Custom Job
    </Button>
  );
}
