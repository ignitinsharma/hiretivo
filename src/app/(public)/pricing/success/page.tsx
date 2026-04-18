"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanTier } from "@/constants/enums";

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

type PollState = "loading" | "success" | "timeout" | "error";

interface SubscriptionStatusResponse {
  data?: {
    plan: PlanTier;
    subscription: {
      status: "ACTIVE" | "PAST_DUE" | "CANCELED";
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    } | null;
  };
  error?: string;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const response = await fetch("/api/billing/subscription-status", {
    cache: "no-store",
  });
  const payload = (await response.json()) as SubscriptionStatusResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to verify subscription");
  }
  return payload;
}

export default function PricingSuccessPage() {
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
        const payload = await fetchSubscriptionStatus();
        const isActive =
          payload.data?.plan === PlanTier.PRO ||
          payload.data?.subscription?.status === "ACTIVE";

        if (isActive) {
          await update({
            user: {
              role: session?.user.role,
              plan: payload.data?.plan ?? PlanTier.PRO,
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
            className="mb-6 h-12 w-12 animate-spin text-brand-primary"
            aria-hidden
          />
        ) : (
          <CheckCircle2
            className="mb-6 h-12 w-12 text-emerald-500"
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
          <Button asChild size="lg" variant="outline">
            <Link href="/recruiter/settings">Billing Settings</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
