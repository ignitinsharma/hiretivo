"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanTier } from "@/constants/enums";
import { billingService } from "@/services/billing.service";

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

type PollState = "loading" | "success" | "timeout" | "error";

function PricingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { data: session, update } = useSession();
  const [state, setState] = useState<PollState>("loading");

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    async function pollSubscription(): Promise<void> {
      attempts += 1;

      try {
        const payload = await billingService.getSubscriptionStatus();
        const isActive =
          payload.plan === PlanTier.PRO ||
          payload.subscription?.status === "ACTIVE";

        if (isActive) {
          await update({
            user: {
              role: session?.user.role,
              plan: payload.plan ?? PlanTier.PRO,
            },
          });
          if (!cancelled) setState("success");
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

      window.setTimeout(() => {
        if (!cancelled) void pollSubscription();
      }, POLL_INTERVAL_MS);
    }

    void pollSubscription();

    return () => {
      cancelled = true;
    };
  }, [session?.user.role, update]);

  const title =
    state === "success"
      ? "You're now on the PRO plan!"
      : state === "timeout"
        ? "Your payment was processed"
        : state === "error"
          ? "Payment received, verification is delayed"
          : "Setting up your PRO plan...";

  const message =
    state === "success"
      ? "Your billing is active and your recruiter account is ready."
      : state === "timeout"
        ? "Your plan update may take a moment while Stripe finishes sending confirmation."
        : state === "error"
          ? "We could not refresh your plan status yet. Check billing again in a moment."
          : "This usually takes a few seconds.";

  return (
    <main className="min-h-[70vh] px-6 py-24">
      <section className="mx-auto flex max-w-xl flex-col items-center text-center">
        {state === "loading" ? (
          <Loader2
            className="mb-6 h-12 w-12 animate-spin text-black"
            aria-hidden
          />
        ) : (
          <CheckCircle2
            className="mb-6 h-12 w-12 text-black"
            aria-hidden
          />
        )}

        <h1 className="mb-4 text-3xl font-extrabold text-slate-950">
          {title}
        </h1>
        <p className="mb-8 text-base text-slate-600">{message}</p>

        {sessionId && (
          <p className="mb-8 text-xs text-slate-400">
            Checkout session: {sessionId}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/recruiter/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="default">
            <Link href="/recruiter/settings">Billing Settings</Link>
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
