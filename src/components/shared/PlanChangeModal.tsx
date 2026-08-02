"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { billingService } from "@/services/billing.service"
import type { BillingPeriod } from "@/constants/enums"

interface PlanChangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "upgrade" | "downgrade"
  targetPlan: string
  targetPlanId: string
  period?: BillingPeriod
  onSuccess?: () => void
}

interface PreviewData {
  chargeToday: number
  currency: string
  currentPeriodEnd: string
}

const USD_FORMAT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function formatCharge(minor: number, currency: string): string {
  // Stripe returns amounts in minor units (cents); divide to get major units
  const formatter =
    currency.toUpperCase() === "USD"
      ? USD_FORMAT
      : new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() })
  return formatter.format(minor / 100)
}

/*
 * PlanChangeModal
 * Shared modal for in-app plan upgrades and downgrades.
 * Upgrade: fetches a proration preview then calls changePlan on confirm.
 * Downgrade: shows a static confirmation (no charge) then schedules via changePlan.
 */
export function PlanChangeModal({
  open,
  onOpenChange,
  mode,
  targetPlan,
  targetPlanId,
  period,
  onSuccess,
}: PlanChangeModalProps) {
  const { update } = useSession()
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function fetchPreview() {
    setLoadingPreview(true)
    setPreviewError(false)
    try {
      const result = await billingService.previewPlanChange(targetPlanId, period)
      setPreview({
        chargeToday: result.chargeToday,
        currency: result.currency ?? "USD",
        currentPeriodEnd: result.currentPeriodEnd,
      })
    } catch {
      setPreviewError(true)
    } finally {
      setLoadingPreview(false)
    }
  }

  useEffect(() => {
    if (open && mode === "upgrade") {
      setPreview(null)
      fetchPreview()
    }
    if (!open) {
      // Reset on close so stale state doesn't flash on reopen
      setPreview(null)
      setPreviewError(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleConfirm() {
    setConfirming(true)
    try {
      await billingService.changePlan(targetPlanId, period)
      const msg =
        mode === "upgrade"
          ? `Plan upgraded to ${targetPlan}!`
          : `Downgrade to ${targetPlan} scheduled.`
      toast.success(msg)
      // Invalidate subscription-status so sidebar + billing tab refetch from DB immediately.
      // Also refresh the JWT so plan-gated server checks stay consistent.
      void queryClient.invalidateQueries({ queryKey: ["billing-subscription-status"] })
      await update()
      onSuccess?.()
      onOpenChange(false)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setConfirming(false)
    }
  }

  const isUpgrade = mode === "upgrade"
  const title = isUpgrade ? `Upgrade to ${targetPlan}` : `Downgrade to ${targetPlan}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border border-brand-border bg-white p-6 max-w-md w-full">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-semibold text-xl text-brand-foreground leading-snug tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>

        {isUpgrade ? (
          <>
            {loadingPreview && (
              <div className="space-y-3 mb-6" aria-label="Loading plan details">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>
            )}

            {!loadingPreview && previewError && (
              <div className="flex flex-col items-start gap-3 mb-6">
                <div className="flex items-center gap-2 text-brand-danger">
                  <AlertCircle className="size-4 shrink-0" />
                  <p className="text-sm text-brand-foreground-muted">
                    Could not load plan details. Try again.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchPreview}>
                  Retry
                </Button>
              </div>
            )}

            {!loadingPreview && !previewError && preview && (
              <div className="space-y-2 mb-6">
                <p className="text-sm text-brand-foreground-muted">
                  Charged today:{" "}
                  <span className="font-semibold text-brand-foreground">
                    {formatCharge(preview.chargeToday, preview.currency)}
                  </span>
                </p>
                <p className="text-sm text-brand-foreground-muted">
                  Next renewal:{" "}
                  <span className="font-semibold text-brand-foreground">
                    {format(new Date(preview.currentPeriodEnd), "MMM d, yyyy")}
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          <DialogDescription
            className={cn(
              "text-sm text-brand-foreground-muted leading-relaxed mb-6"
            )}
          >
            Your current plan stays active until your next renewal. No charge or refund today.
          </DialogDescription>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={confirming}
            loadingText={isUpgrade ? "Upgrading…" : "Scheduling…"}
            disabled={isUpgrade && (loadingPreview || previewError || !preview)}
          >
            {isUpgrade ? "Confirm upgrade" : "Schedule downgrade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
