import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserFrame } from "@/components/home/BrowserFrame";
import { JOB_DASHBOARD_SECTION } from "@/config/home-page";

export function JobDashboardSection() {
  const { eyebrow, heading, body, bullets, linkText, linkHref } =
    JOB_DASHBOARD_SECTION;

  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
          <div className="min-w-0 lg:col-span-3 lg:order-first">
            <BrowserFrame>
              <Image
                src="/images/dashboard.png"
                alt="Hiretivo dashboard with recommended jobs and application tracker"
                width={1694}
                height={929}
                className="w-full h-auto"
              />
            </BrowserFrame>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              {eyebrow}
            </p>
            <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              {heading}
            </h2>
            <p className="mt-4 break-words text-base leading-relaxed text-brand-foreground-muted">
              {body}
            </p>

            <ul className="mt-6 space-y-3" role="list">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-relaxed text-brand-foreground">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild variant="primary" size="lg">
                <Link href={linkHref}>
                  {linkText}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
