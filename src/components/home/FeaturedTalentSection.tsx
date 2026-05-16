import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock, Star } from "lucide-react";

interface MockEngineer {
  id: string;
  firstName: string;
  lastNameInitial: string;
  role: string;
  yearsExperience: number;
  score: number;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  timezoneOverlap: string;
  availability: string;
}

const MOCK_ENGINEERS: MockEngineer[] = [
  {
    id: "mock-1",
    firstName: "Priya",
    lastNameInitial: "S.",
    role: "Senior React Engineer",
    yearsExperience: 6,
    score: 84,
    skills: ["React", "Node.js", "AWS", "PostgreSQL"],
    salaryMin: 80,
    salaryMax: 120,
    timezoneOverlap: "5+ hrs US overlap",
    availability: "Available Jun 2026",
  },
  {
    id: "mock-2",
    firstName: "Arjun",
    lastNameInitial: "K.",
    role: "Full-Stack Engineer",
    yearsExperience: 5,
    score: 91,
    skills: ["TypeScript", "Next.js", "Go", "Docker"],
    salaryMin: 70,
    salaryMax: 110,
    timezoneOverlap: "4+ hrs US overlap",
    availability: "Immediate",
  },
  {
    id: "mock-3",
    firstName: "Ananya",
    lastNameInitial: "R.",
    role: "Platform Engineer",
    yearsExperience: 7,
    score: 78,
    skills: ["Kubernetes", "Terraform", "Python", "GCP"],
    salaryMin: 90,
    salaryMax: 130,
    timezoneOverlap: "6+ hrs US overlap",
    availability: "Available Jul 2026",
  },
];

function formatSalaryRange(min: number, max: number): string {
  return `$${min}k–$${max}k/yr`;
}

function EngineerCard({ engineer }: { engineer: MockEngineer }) {
  return (
    <div className="group flex h-full flex-col rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-brand-foreground">
              {engineer.firstName} {engineer.lastNameInitial}
            </h3>
            <ShieldCheck className="h-5 w-5 text-brand-primary" />
          </div>
          <p className="mt-0.5 text-sm text-brand-foreground-muted">
            {engineer.role} · {engineer.yearsExperience} yrs
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-surface px-2 py-1">
          <Star className="h-3.5 w-3.5 fill-brand-primary text-brand-primary" />
          <span className="text-sm font-bold text-brand-foreground">
            {engineer.score}
          </span>
          <span className="text-xs text-brand-foreground-muted">/100</span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {engineer.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mb-4 space-y-1.5 text-sm text-brand-foreground-muted">
        <p>{formatSalaryRange(engineer.salaryMin, engineer.salaryMax)}</p>
        <p>{engineer.timezoneOverlap}</p>
        <p>{engineer.availability}</p>
      </div>

      <div className="mt-auto">
        <Link
          href="/recruiter/signup"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:border-brand-primary hover:text-brand-primary"
        >
          <Lock className="h-4 w-4" />
          Unlock Profile
        </Link>
      </div>
    </div>
  );
}

export function FeaturedTalentSection() {
  return (
    <section
      className="bg-brand-surface py-20 md:py-24"
      data-purpose="featured-talent"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
            Verified Engineers, Ready to Hire
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
            Every profile is hand-reviewed and scored. See their GitHub before
            you book a call.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_ENGINEERS.map((engineer) => (
            <EngineerCard key={engineer.id} engineer={engineer} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/recruiter/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#5a47d9]"
          >
            Browse the talent pool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
