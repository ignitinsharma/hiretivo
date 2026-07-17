"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function PricingSuccessContent() {
  return (
    <main className="min-h-[70vh] bg-white px-6 py-24">
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
          <CheckCircle2 className="h-8 w-8 text-brand-primary" aria-hidden />
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
          You&apos;re all set!
        </h1>
        <p className="mb-8 max-w-lg text-base leading-relaxed text-brand-foreground-muted">
          Your account is active. Start generating tailored resumes and landing interviews.
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" variant="primary">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/generate-resume">
              Generate a Resume
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
