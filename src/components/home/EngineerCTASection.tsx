/*
 * EngineerCTASection
 * Engineer conversion CTA with a verified profile preview and before/after proof.
 * Fully static — no props, client state, or data fetching.
 */

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleCheck,
  LockKeyhole,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeAfterRow {
  label: string;
  before: string;
  after: string;
  showVerifiedIcon?: boolean;
}

interface TrustItem {
  icon: LucideIcon;
  label: string;
  tone: "brand" | "success";
}

interface SignalRowProps {
  label: string;
  showVerifiedIcon?: boolean;
  tone: "before" | "after";
  value: string;
}

const BEFORE_AFTER_ROWS: BeforeAfterRow[] = [
  {
    label: "Status",
    before: "Not Verified",
    after: "Hiretivo Verified",
    showVerifiedIcon: true,
  },
  {
    label: "Visibility",
    before: "Low",
    after: "High",
  },
  {
    label: "Salary visible",
    before: "No",
    after: "Yes",
  },
];

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, label: "100% Free", tone: "success" },
  { icon: LockKeyhole, label: "Secure", tone: "brand" },
  { icon: Zap, label: "Quick Process", tone: "brand" },
];

/*
 * DecorativeUnderline
 * Adds the hand-drawn underline accent used in the reference design.
 */
export function DecorativeUnderline({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 180 14"
      aria-hidden="true"
    >
      <path
        d="M4 9C41 3 100 3 176 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/*
 * SignalRow
 * Renders a compact verification fact with semantic before/after treatment.
 */
function SignalRow({
  label,
  showVerifiedIcon = false,
  tone,
  value,
}: SignalRowProps) {
  const isAfter = tone === "after";

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-brand-border bg-white px-3 py-2.5">
      <span className="text-xs font-semibold text-brand-foreground">
        {label}
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-right text-[11px] font-bold",
          isAfter
            ? "bg-brand-success/[0.07] text-brand-success"
            : "bg-brand-danger/[0.07] text-brand-danger",
        )}
      >
        <span className="truncate">{value}</span>
        {showVerifiedIcon && isAfter && (
          <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
      </span>
    </div>
  );
}

/*
 * TrustPill
 * Renders one compact trust signal beneath the primary CTA.
 */
function TrustPill({ item }: { item: TrustItem }) {
  const Icon = item.icon;
  const isSuccess = item.tone === "success";

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full bg-brand-surface px-3 py-2">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isSuccess
            ? "bg-brand-success/[0.08] text-brand-success"
            : "bg-brand-primary/[0.08] text-brand-primary",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate text-xs font-semibold text-brand-foreground">
        {item.label}
      </span>
    </div>
  );
}

/*
 * VerificationSeal
 * Prominent verified badge with the small burst annotation from the reference.
 */
function VerificationSeal() {
  return (
    <div className="relative shrink-0 pr-3 pt-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/25 bg-white text-brand-primary">
        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
      </span>
      <svg
        className="absolute right-0 top-0 h-7 w-7 text-brand-primary"
        fill="none"
        viewBox="0 0 28 28"
        aria-hidden="true"
      >
        <path
          d="M13 2L11 8M24 8L19 12M26 20H20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

/*
 * VerifiedProfileCard
 * Shows the profile signal recruiters see after Hiretivo verification.
 */
function VerifiedProfileCard() {
  return (
    <article className="rounded-xl border border-brand-primary/20 bg-white p-4 transition-colors hover:border-brand-primary/40 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-primary/20 bg-brand-primary/[0.06] text-xl font-bold text-brand-primary">
            HV
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-brand-foreground">
              Hiretivo Verified
            </p>
            <p className="text-sm text-brand-foreground-muted">
              Profile signal
            </p>
          </div>
        </div>
        <VerificationSeal />
      </div>

      <div className="mt-4 rounded-xl border border-brand-primary/20 bg-brand-primary/[0.035] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
          Verification badge
        </p>
        <div className="mt-4 grid gap-2">
          {BEFORE_AFTER_ROWS.map((row) => (
            <SignalRow
              key={row.label}
              label={row.label}
              showVerifiedIcon={row.showVerifiedIcon}
              tone="after"
              value={row.after}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

/*
 * ComparisonCard
 * Renders either the unverified or verified profile signal card.
 */
export function ComparisonCard({ tone }: { tone: "before" | "after" }) {
  const isAfter = tone === "after";

  return (
    <article
      className={cn(
        "min-w-0 rounded-xl border bg-white p-4 transition-colors",
        isAfter
          ? "border-brand-success/20 hover:border-brand-success/40"
          : "border-brand-danger/20 hover:border-brand-danger/40",
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center gap-2",
          isAfter ? "text-brand-success" : "text-brand-danger",
        )}
      >
        {isAfter ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <X className="h-4 w-4" aria-hidden="true" />
        )}
        <p className="text-[11px] font-bold uppercase tracking-wider">
          {isAfter ? "After verification" : "Before"}
        </p>
      </div>

      <div className="grid gap-2">
        {BEFORE_AFTER_ROWS.map((row) => (
          <SignalRow
            key={row.label}
            label={row.label}
            showVerifiedIcon={row.showVerifiedIcon}
            tone={tone}
            value={isAfter ? row.after : row.before}
          />
        ))}
      </div>
    </article>
  );
}

/*
 * BadgeSignalBoard
 * Product proof board showing how verification changes recruiter-facing signals.
 */
function BadgeSignalBoard() {
  return (
    <div className="grid min-w-0 gap-5">
      <VerifiedProfileCard />

      <div className="relative grid min-w-0 gap-5 md:grid-cols-2 md:gap-8">
        <ComparisonCard tone="before" />
        <span
          className="absolute left-1/2 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand-primary/20 bg-white text-brand-primary md:flex"
          aria-hidden="true"
        >
          <ArrowRight className="h-5 w-5" />
        </span>
        <ComparisonCard tone="after" />
      </div>
    </div>
  );
}

/*
 * EngineerCTASection
 * Renders the complete engineer conversion section and verified profile preview.
 */
export function EngineerCTASection() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="relative grid min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white lg:grid-cols-[0.92fr_1.08fr]">
          <span
            className="absolute left-0 top-0 h-full w-1 bg-brand-primary"
            aria-hidden="true"
          />

          {/* Left conversion copy */}
          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-12">
            <div className="relative w-fit">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Are you an Indian engineer?
              </p>
              <DecorativeUnderline className="absolute -bottom-2 left-0 h-3 w-36 text-brand-primary/50" />
            </div>

            <h2 className="mt-9 max-w-xl break-words text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground sm:text-5xl">
              <span className="block">
                Get your Hiretivo
                <span className="ml-3 inline-flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground sm:h-11 sm:w-11">
                  <BadgeCheck
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    aria-hidden="true"
                  />
                </span>
              </span>
              <span className="block">badge.</span>
              <span className="relative mt-2 inline-block text-brand-primary">
                Free forever.
                <DecorativeUnderline className="absolute -bottom-3 left-1 h-3 w-full text-brand-primary/70" />
              </span>
            </h2>

            <p className="mt-10 max-w-md break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              Apply once, get reviewed, and show recruiters that your skills,
              salary range, and availability are already verified.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button asChild variant="primary" size="lg">
                <Link href="/seeker/register">
                  <ShieldCheck aria-hidden="true" />
                  Start Verification
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>

              <div className="flex items-center gap-2 text-brand-foreground-muted">
                <svg
                  className="hidden h-7 w-9 text-brand-foreground-secondary sm:block"
                  fill="none"
                  viewBox="0 0 38 28"
                  aria-hidden="true"
                >
                  <path
                    d="M2 7C15 3 25 8 31 20M31 20L27 16M31 20L36 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
                <p className="-rotate-2 text-sm font-medium italic">
                  Takes ~10 minutes
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-2 rounded-xl border border-brand-border bg-white p-2 sm:grid-cols-3">
              {TRUST_ITEMS.map((item) => (
                <TrustPill key={item.label} item={item} />
              ))}
            </div>
          </div>

          {/* Right verification proof */}
          <div className="min-w-0 border-t border-brand-border p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Profile signal
            </p>
            <h3 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-brand-foreground">
              Verification changes what recruiters see.
            </h3>
            <div className="mt-6">
              <BadgeSignalBoard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
