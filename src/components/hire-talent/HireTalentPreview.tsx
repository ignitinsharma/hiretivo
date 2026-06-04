import { BadgeCheck, Lock, Unlock } from "lucide-react";

interface TalentPreview {
  name: string;
  score: number;
  skills: string[];
  salary: string;
  availability: string;
  state: "Locked" | "Unlocked";
}

const TALENT_PREVIEW: TalentPreview[] = [
  {
    name: "Priya S.",
    score: 92,
    skills: ["React", "TypeScript", "Node.js"],
    salary: "$55k-$70k",
    availability: "2 weeks",
    state: "Locked",
  },
  {
    name: "Arjun M.",
    score: 88,
    skills: ["Go", "Postgres", "AWS"],
    salary: "$60k-$78k",
    availability: "Now",
    state: "Unlocked",
  },
  {
    name: "Neha R.",
    score: 84,
    skills: ["Python", "Django", "Data"],
    salary: "$48k-$62k",
    availability: "30 days",
    state: "Locked",
  },
  {
    name: "Kabir V.",
    score: 81,
    skills: ["Java", "Spring", "Kafka"],
    salary: "$58k-$74k",
    availability: "Now",
    state: "Locked",
  },
];

export function HireTalentPreview() {
  return (
    <section className="border-y border-brand-border bg-white px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-brand-primary">
              Talent pool preview
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-brand-foreground md:text-4xl">
              Scan the signals recruiters actually need.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-brand-foreground-muted">
            Public browsing keeps contact details hidden until a recruiter uses
            an unlock.
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white">
          <div className="hidden grid-cols-[1.2fr_0.6fr_1.4fr_0.9fr_0.8fr_0.75fr] gap-4 border-b border-brand-border bg-brand-surface px-5 py-3 text-xs font-bold uppercase tracking-normal text-brand-foreground-muted md:grid">
            <span>Engineer</span>
            <span>Score</span>
            <span>Skills</span>
            <span>Salary</span>
            <span>Available</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-brand-border">
            {TALENT_PREVIEW.map((engineer) => {
              const isUnlocked = engineer.state === "Unlocked";
              const StateIcon = isUnlocked ? Unlock : Lock;

              return (
                <article
                  key={engineer.name}
                  className="grid min-w-0 gap-4 px-5 py-5 md:grid-cols-[1.2fr_0.6fr_1.4fr_0.9fr_0.8fr_0.75fr] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-foreground">
                        {engineer.name}
                      </p>
                      <BadgeCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-xs text-brand-foreground-muted md:hidden">
                      Hiretivo score {engineer.score}/100
                    </p>
                  </div>

                  <div className="hidden md:block">
                    <span className="rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-sm font-bold text-brand-foreground">
                      {engineer.score}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-wrap gap-2">
                    {engineer.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm font-medium text-brand-foreground">
                    {engineer.salary}
                  </p>
                  <p className="text-sm text-brand-foreground-muted">
                    {engineer.availability}
                  </p>
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-bold text-brand-foreground">
                      <StateIcon className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
                      {engineer.state}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
