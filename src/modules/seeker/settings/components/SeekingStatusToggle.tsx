"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SeekingStatus } from "@/constants/enums";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";

/*
 * STATUS_OPTIONS
 * Ordered list of seeking-status choices.
 * Order matches CONTEXT.md decision 3 and the talent pool filter chip order:
 * most-active → least-active. Each entry pairs a SeekingStatus enum value
 * with its display label and dot color class (brand tokens preferred).
 */
const STATUS_OPTIONS = [
  { value: SeekingStatus.ACTIVELY_LOOKING, label: "Actively Looking", dotClass: "bg-brand-success" },
  { value: SeekingStatus.OPEN_TO_OFFERS,   label: "Open to Offers",   dotClass: "bg-yellow-400" },
  { value: SeekingStatus.NOT_LOOKING,      label: "Not Looking",      dotClass: "bg-brand-foreground-secondary" },
] as const;

/*
 * useUpdateSeekingStatus
 * Mutation that PATCHes /api/seeker/settings with the chosen seekingStatus.
 * The PATCH route requires `name` (Zod schema), so we include the current name
 * from the cached settings query in the payload.
 * Invalidates ["seeker-settings"] on success so the segmented control re-renders
 * with the freshly persisted value.
 */
function useUpdateSeekingStatus(currentName: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: SeekingStatus) => {
      const res = await fetch("/api/seeker/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentName ?? "", seekingStatus: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ data: { success: boolean } }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seeker-settings"] });
      toast.success("Seeking status updated");
    },
    onError: () => {
      toast.error("Failed to update seeking status. Please try again.");
    },
  });
}

/*
 * SeekingStatusToggle
 * Renders a 3-button segmented control letting the engineer set their visible
 * seeking status. Reads current value from cached settings; selecting a button
 * persists immediately via PATCH /api/seeker/settings.
 * Subtitle is the required consent disclosure: "Recruiters on Hiretivo can see this."
 */
export function SeekingStatusToggle() {
  const { data, isLoading } = useSeekerSettingsData();
  const settings = data?.data;
  const current: SeekingStatus = (settings?.seekingStatus as SeekingStatus | undefined) ?? SeekingStatus.OPEN_TO_OFFERS;
  const { mutate, isPending } = useUpdateSeekingStatus(settings?.name);

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-brand-foreground">Seeking Status</h3>
        <p className="text-sm text-brand-foreground-muted mt-0.5">
          Recruiters on Hiretivo can see this.
        </p>
      </div>

      <div role="radiogroup" aria-label="Seeking status" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => { if (!isSelected) mutate(opt.value); }}
              disabled={isPending || isLoading}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 text-brand-foreground"
                  : "border-brand-border bg-white text-brand-foreground hover:bg-brand-surface"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} aria-hidden="true" />
              <span className="font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
