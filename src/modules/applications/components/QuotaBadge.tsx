"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

async function fetchQuota() {
  const res = await fetch("/api/generation-quota");
  if (!res.ok) throw new Error("Failed to load quota");
  return res.json() as Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    resetsAt: string;
  }>;
}

export function QuotaBadge() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["generation-quota"],
    queryFn: fetchQuota,
    staleTime: 60_000,
  });

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-brand-foreground-muted" />;
  if (!data) return null;

  const exhausted = !data.allowed;

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="text-sm font-bold text-brand-foreground mb-3">Generation Quota</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-brand-foreground-muted">Used this month</span>
          <span className={`font-semibold ${exhausted ? "text-red-600" : "text-brand-foreground"}`}>
            {data.used}/{data.limit}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-brand-border">
          <div
            className={`h-1.5 rounded-full transition-all ${
              exhausted ? "bg-red-500" : "bg-brand-primary"
            }`}
            style={{ width: `${Math.min((data.used / data.limit) * 100, 100)}%` }}
          />
        </div>
        {exhausted && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-red-600">
              You&apos;ve used all {data.limit} generations this month.
            </p>
            <button
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark"
              onClick={() => router.push("/pricing")}
            >
              Upgrade for more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
