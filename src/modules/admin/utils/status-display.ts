import { VerificationStatus, PlanTier } from "@/constants/enums";

/*
 * status-display
 * Single source of human-readable labels + semantic badge styles for admin enums.
 * Keeps display strings out of the raw enum values (no "NOT_SUBMITTED" in the UI)
 * and gives every status/tier a consistent colored badge across all admin surfaces.
 */

interface BadgeDisplay {
  label: string;
  /** Brand/native-tailwind classes for a small bordered badge (no shadow, no dark mode). */
  badge: string;
}

/*
 * VERIFICATION_STATUS_DISPLAY
 * Maps each VerificationStatus to a human label and a semantic badge class set.
 */
export const VERIFICATION_STATUS_DISPLAY: Record<VerificationStatus, BadgeDisplay> = {
  [VerificationStatus.NOT_SUBMITTED]: {
    label: "Not submitted",
    badge: "border-brand-border bg-gray-50 text-gray-600",
  },
  [VerificationStatus.PENDING]: {
    label: "Pending",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  [VerificationStatus.IN_REVIEW]: {
    label: "In review",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  [VerificationStatus.VERIFIED]: {
    label: "Verified",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  [VerificationStatus.REJECTED]: {
    label: "Rejected",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
};

/*
 * PLAN_TIER_DISPLAY
 * Maps each PlanTier to a human label and a semantic badge class set.
 */
export const PLAN_TIER_DISPLAY: Record<PlanTier, BadgeDisplay> = {
  [PlanTier.FREE]: {
    label: "Free",
    badge: "border-brand-border bg-gray-50 text-gray-700",
  },
  [PlanTier.STARTER]: {
    label: "Starter",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  [PlanTier.GROWTH]: {
    label: "Growth",
    badge: "border-brand-primary/20 bg-brand-primary/10 text-brand-primary",
  },
  [PlanTier.SCALE]: {
    label: "Scale",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};
