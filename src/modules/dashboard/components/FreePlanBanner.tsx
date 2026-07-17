import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FreePlanBanner() {
  return (
    <div className="flex items-center justify-between bg-white rounded-card border border-brand-border px-5 py-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-pill bg-amber-50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            You have <span className="text-brand-primary">13 applications</span> left
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Upgrade to apply to more jobs and unlock AI-powered tools
          </p>
        </div>
      </div>
      <Button asChild variant="primary" size="sm">
        <Link href="/pricing">See plans</Link>
      </Button>
    </div>
  );
}
