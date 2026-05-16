import { Button } from "@/components/ui/button";
import Link from "next/link";

/*
 * HomeCtaSection
 * Bottom CTA section on homepage: dual signup buttons for recruiters and engineers.
 */
export function HomeCtaSection() {
  return (
    <section className="bg-brand-primary px-4 py-16 md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-bold text-3xl text-brand-primary-foreground tracking-tight">
          Ready to hire smarter?
        </h2>
        <p className="mt-3 text-base text-brand-primary-foreground/80 leading-relaxed">
          Join US/EU startups hiring verified Indian engineers — or get
          discovered as one.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            variant="secondary"
            asChild
            className="bg-white text-brand-primary hover:bg-brand-surface"
          >
            <Link href="/auth/signup?role=recruiter">
              Find Engineers &rarr;
            </Link>
          </Button>
          <Button
            variant="ghost"
            asChild
            className="text-brand-primary-foreground border border-brand-primary-foreground/30 hover:bg-brand-primary-dk"
          >
            <Link href="/auth/signup?role=seeker">
              Get Verified &rarr;
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
