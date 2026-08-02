"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useGenerationQuota } from "@/hooks/use-generation-quota";

export function FreePlanBanner() {
  const { data: quota, isLoading } = useGenerationQuota();

  return (
    <div className="flex items-center justify-between bg-white rounded-card border border-brand-border px-5 py-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-pill bg-amber-50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          {isLoading || !quota ? (
            <Skeleton className="h-5 w-48" />
          ) : quota.plan === "UNLIMITED" ? (
            <p className="text-sm font-semibold text-gray-900">
              <span className="text-brand-primary">Unlimited</span> applications
            </p>
          ) : (
            <p className="text-sm font-semibold text-gray-900">
              You have{" "}
              <span className="text-brand-primary">
                {Math.max(0, quota.limit - quota.used)}
              </span>{" "}
              applications left
            </p>
          )}
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
