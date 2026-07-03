"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OptimizeMode } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";

const MODE_OPTIONS: Array<{ value: OptimizeMode; label: string; helper: string }> = [
  {
    value: OptimizeMode.HONEST,
    label: "Honest",
    helper: "Tailors only what your profile supports.",
  },
  {
    value: OptimizeMode.AGGRESSIVE,
    label: "Aggressive",
    helper: "Pushes phrasing harder — never fabricates.",
  },
];

/*
 * OptimizeModeSection
 * Honest/Aggressive segmented control for resume & cover-letter tailoring.
 * Honest is the default; the toggle persists via PATCH /api/seeker/optimize-mode.
 */
export function OptimizeModeSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<{ data: { optimizeMode: OptimizeMode } }>({
    queryKey: ["seeker-optimize-mode"],
    queryFn: seekerService.getOptimizeMode,
    staleTime: 60_000,
  });
  const currentMode = data?.data.optimizeMode ?? OptimizeMode.HONEST;

  const saveMutation = useMutation({
    mutationFn: seekerService.updateOptimizeMode,
    onSuccess: () => {
      toast.success("Optimize mode updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-optimize-mode"] });
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  return (
    <section id="optimize-mode" className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border p-6">
        <h3 className="text-lg font-bold text-brand-foreground">Resume Optimize Mode</h3>
        <p className="text-sm text-brand-foreground-muted">
          Controls how AI tailors your resume and cover letter for each application.
        </p>
      </div>

      {isError && (
        <div className="px-6 pt-4">
          <p className="text-sm text-red-500">Failed to load optimize mode. Please refresh.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 p-6 sm:flex-row">
        {MODE_OPTIONS.map((option) => {
          const isActive = currentMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isLoading || saveMutation.isPending}
              onClick={() => saveMutation.mutate(option.value)}
              className={cn(
                "flex-1 rounded-lg border p-4 text-left transition-colors disabled:opacity-50",
                isActive
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-brand-border hover:bg-brand-surface",
              )}
            >
              <p className={cn("text-sm font-semibold", isActive ? "text-brand-primary" : "text-brand-foreground")}>
                {option.label}
              </p>
              <p className="mt-1 text-xs text-brand-foreground-muted">{option.helper}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
