/*
 * HowItWorksSection
 * Homepage section showing recruiter and engineer onboarding flows side by side.
 */
export function HowItWorksSection() {
  const RECRUITER_STEPS = [
    {
      n: "1",
      title: "Sign up free",
      desc: "Create your recruiter account in 2 minutes.",
    },
    {
      n: "2",
      title: "Browse verified engineers",
      desc: "See blurred profiles with Hiretivo Score, skills, and salary range.",
    },
    {
      n: "3",
      title: "Unlock & contact",
      desc: "Unlock contact details with your monthly quota.",
    },
    {
      n: "4",
      title: "Hire in 7 days",
      desc: "Email directly, schedule interviews, make offers.",
    },
  ];
  const ENGINEER_STEPS = [
    {
      n: "1",
      title: "Submit GitHub + bio",
      desc: "Share your GitHub, top 3 projects, and a short bio.",
    },
    {
      n: "2",
      title: "Get reviewed (48h)",
      desc: "Our team assigns your Hiretivo Score (0–100).",
    },
    {
      n: "3",
      title: "Go live",
      desc: "Make your profile public — US/EU startups start finding you.",
    },
    {
      n: "4",
      title: "Get invited",
      desc: "Recruiters invite you to interview directly.",
    },
  ];

  return (
    <section className="bg-white px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bold text-3xl text-brand-foreground text-center mb-10 tracking-tight">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {[
            { label: "For Recruiters", steps: RECRUITER_STEPS },
            { label: "For Engineers", steps: ENGINEER_STEPS },
          ].map((side) => (
            <div key={side.label}>
              <p className="font-medium text-xs uppercase tracking-wider text-brand-foreground-secondary mb-4">
                {side.label}
              </p>
              <ol className="flex flex-col gap-4">
                {side.steps.map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-brand-primary-foreground">
                      {step.n}
                    </span>
                    <div>
                      <p className="font-semibold text-brand-foreground">
                        {step.title}
                      </p>
                      <p className="text-sm text-brand-foreground-muted">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
