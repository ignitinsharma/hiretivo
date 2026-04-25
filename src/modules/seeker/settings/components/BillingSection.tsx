"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanTier } from "@/constants/enums";
import { billingService } from "@/services/billing.service";

const FREE_FEATURES = [
  "Apply to 10 jobs/month",
  "Basic profile listing",
  "Email support",
];

const PRO_FEATURES = [
  "Unlimited job applications",
  "AI resume optimizer",
  "Priority profile listing",
  "Early access to new jobs",
  "Dedicated support",
];

export function BillingSection() {
  const { data: session } = useSession();
  const plan = (session?.user as { plan?: string } | undefined)?.plan ?? PlanTier.FREE;
  const isPro = plan === PlanTier.PRO;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const url = await billingService.createCheckoutSession();
      window.location.href = url;
    },
    onError: () => toast.error("Could not start checkout. Try again."),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const url = await billingService.createPortalSession();
      window.location.href = url;
    },
    onError: () => toast.error("Could not open billing portal. Try again."),
  });

  return (
    <section id="billing" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Billing & Subscription</h3>
        <p className="text-sm text-slate-500">Manage your plan and billing information.</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`p-5 rounded-xl border-2 transition-colors ${
            !isPro ? "border-primary bg-primary/5" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-900">Free</span>
            {!isPro && (
              <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase rounded">
                Current
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-4">$0</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`p-5 rounded-xl border-2 transition-colors ${
            isPro ? "border-primary bg-primary/5" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-bold text-slate-900">Pro</span>
            </div>
            {isPro && (
              <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase rounded">
                Current
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-4">
            $19 <span className="text-sm font-normal text-slate-500">/month</span>
          </p>
          <ul className="space-y-2 mb-5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? "Opening…" : "Manage Billing"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? "Loading…" : "Upgrade to Pro"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
