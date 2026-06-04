import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  IndianRupee,
  Lock,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface EngineerCard {
  name: string;
  role: string;
  score: number;
  skills: string[];
  salary: string;
  availability: string;
  status: "Locked" | "Unlocked";
}

const ENGINEER_CARDS: EngineerCard[] = [
  {
    name: "Priya S.",
    role: "Senior React Engineer",
    score: 92,
    skills: ["React", "TypeScript", "Node.js"],
    salary: "$55k-$70k",
    availability: "Available in 2 weeks",
    status: "Locked",
  },
  {
    name: "Arjun M.",
    role: "Backend Platform Engineer",
    score: 88,
    skills: ["Go", "Postgres", "AWS"],
    salary: "$60k-$78k",
    availability: "Open now",
    status: "Unlocked",
  },
];

function EngineerCardPreview({ engineer }: { engineer: EngineerCard }) {
  const isUnlocked = engineer.status === "Unlocked";
  const StatusIcon = isUnlocked ? Unlock : Lock;

  return (
    <article className="min-w-0 rounded-xl border border-brand-border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-brand-foreground">
              {engineer.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-2 py-0.5 text-xs font-bold text-brand-primary">
              <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              Verified
            </span>
          </div>
          <p className="mt-1 text-sm text-brand-foreground-muted">
            {engineer.role}
          </p>
        </div>
        <div className="shrink-0 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-center">
          <p className="text-lg font-bold leading-none text-brand-foreground">
            {engineer.score}
          </p>
          <p className="mt-1 text-[11px] font-medium text-brand-foreground-muted">
            score
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {engineer.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand-foreground"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2 border-t border-brand-border pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-brand-foreground-muted">
          <IndianRupee className="h-4 w-4 text-brand-primary" aria-hidden="true" />
          {engineer.salary}
        </div>
        <div className="flex items-center gap-2 text-brand-foreground-muted">
          <Sparkles className="h-4 w-4 text-brand-primary" aria-hidden="true" />
          {engineer.availability}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-surface px-3 py-2">
        <span className="min-w-0 text-xs font-semibold text-brand-foreground-muted">
          {isUnlocked ? "Contact details visible" : "Contact details hidden"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-brand-primary">
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {engineer.status}
        </span>
      </div>
    </article>
  );
}

export function HireTalentHero() {
  return (
    <section className="grid-bg overflow-hidden border-b border-brand-border bg-white px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl min-w-0 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="min-w-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-normal text-brand-foreground-muted">
              Verified talent marketplace
            </span>
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-brand-foreground md:text-5xl lg:text-6xl">
            Hire verified Indian engineers without guessing.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-foreground-muted">
            Browse verified profiles, compare salary expectations upfront, and
            unlock contact details only when there is real hiring intent.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
              <Link href="/recruiter/register">
                Start hiring
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-brand-foreground-muted">
            After signup, recruiters browse the talent pool at
            {" "}
            <span className="break-all font-semibold text-brand-foreground">
              /recruiter/talent
            </span>
            .
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white p-4 md:p-6">
          <div className="min-w-0 rounded-xl border border-brand-border bg-brand-surface p-4 md:p-5">
            <div className="mb-4 flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-normal text-brand-primary">
                  Browse talent pool
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-normal text-brand-foreground">
                  Compact verified profiles
                </h2>
              </div>
              <span className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-brand-foreground">
                India-first
              </span>
            </div>
            <div className="space-y-3">
              {ENGINEER_CARDS.map((engineer) => (
                <EngineerCardPreview key={engineer.name} engineer={engineer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
