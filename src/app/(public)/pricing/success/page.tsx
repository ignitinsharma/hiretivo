"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, CheckCircle2, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanTier } from "@/constants/enums";
import { billingService } from "@/services/billing.service";

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

type PollState = "loading" | "success" | "timeout" | "error";

function PricingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { update } = useSession();
  const [state, setState] = useState<PollState>("loading");
  const [activePlan, setActivePlan] = useState<PlanTier | null>(null);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;
    let timeoutId: number | null = null;

    async function pollSubscription(): Promise<void> {
      attempts += 1;

      try {
        const payload = await billingService.getSubscriptionStatus();
        const isActive =
          payload.plan !== PlanTier.FREE ||
          payload.subscription?.status === "ACTIVE";

        if (isActive) {
          if (!cancelled) {
            setState("success");
            setActivePlan(payload.plan ?? PlanTier.STARTER);
          }

          void update({
            user: {
              plan: payload.plan ?? PlanTier.STARTER,
            },
          }).catch(() => {
            // Billing status is already persisted in the database. Session
            // refresh is best-effort so the success screen never gets stuck.
          });
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          if (!cancelled) setState("timeout");
          return;
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          if (!cancelled) setState("error");
          return;
        }
      }

      timeoutId = window.setTimeout(() => {
        if (!cancelled) void pollSubscription();
      }, POLL_INTERVAL_MS);
    }

    void pollSubscription();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [update]);

  const planName =
    activePlan === PlanTier.STARTER ? "Starter"
    : activePlan === PlanTier.GROWTH ? "Growth"
    : activePlan === PlanTier.SCALE ? "Scale"
    : "paid";

  const title =
    state === "success"
      ? `You're now on the ${planName} plan!`
      : state === "timeout"
        ? "Your payment was processed"
        : state === "error"
          ? "Payment received, verification is delayed"
          : "Setting up your plan...";

  const message =
    state === "success"
      ? "Your billing is active and your recruiter account is ready."
      : state === "timeout"
        ? "Your plan update may take a moment while payment confirmation finishes processing."
        : state === "error"
          ? "We could not refresh your plan status yet. Check billing again in a moment."
          : "This usually takes a few seconds.";

  return (
    <main className="min-h-[70vh] bg-white px-6 py-24">
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
          {state === "loading" ? (
            <Loader2
              className="h-8 w-8 animate-spin text-brand-primary"
              aria-hidden
            />
          ) : (
            <CheckCircle2
              className="h-8 w-8 text-brand-primary"
              aria-hidden
            />
          )}
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
          {title}
        </h1>
        <p className="mb-8 max-w-lg text-base leading-relaxed text-brand-foreground-muted">
          {message}
        </p>

        {sessionId && (
          <p className="mb-8 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-foreground-muted">
            Checkout session: {sessionId}
          </p>
        )}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" variant="primary">
            <Link href="/recruiter/dashboard">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/recruiter/settings?tab=billing">
              <Settings className="h-4 w-4" aria-hidden />
              Billing Settings
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

const DynamicPricingSuccess = dynamic(() => Promise.resolve(PricingSuccessContent), {
  ssr: false,
});

export default DynamicPricingSuccess;
