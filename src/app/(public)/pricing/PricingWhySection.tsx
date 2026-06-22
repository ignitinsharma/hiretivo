import {
  ShieldCheck,
  Users,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";

/*
 * WhyHiretivo
 * Value-prop section on /pricing — renders above billing toggle.
 * 4 feature cards + stats bar explaining Hiretivo's differentiators.
 */
export default function WhyHiretivo() {
  const features = [
    {
      icon: Users,
      title: "Pre-vetted engineers",
      description:
        "Every engineer passes manual verification. No ghosting, no inflated CVs.",
      accent: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      icon: ClipboardCheck,
      title: "Match score first",
      description:
        "See exactly how well an engineer fits before spending credits.",
      accent: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "India's top 10%",
      description:
        "Senior engineers competing for global remote opportunities.",
      accent: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      icon: ShieldCheck,
      title: "Hire in days",
      description:
        "Direct access to verified talent without recruiters or agencies.",
      accent: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-sm font-medium text-violet-700">
            Built for recruiters
          </span>

          <h2 className="mt-6 text-5xl font-bold tracking-tight text-slate-950">
            Why Hiretivo?
          </h2>

          <p className="mt-5 text-xl text-slate-500">
            Everything you need to find, evaluate, and hire
            the right engineers faster.
          </p>
        </div>

        {/* Cards */}

        <div className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
              >
                {/* Icon */}

                <div
                  className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.accent}`}
                >
                  <Icon
                    className={`h-8 w-8 ${feature.iconColor}`}
                  />
                </div>

                {/* Content */}

                <h3 className="text-2xl font-semibold leading-tight text-slate-900">
                  {feature.title}
                </h3>

                <div className="mt-5 h-1 w-12 rounded-full bg-violet-500" />

                <p className="mt-6 text-base leading-8 text-slate-600">
                  {feature.description}
                </p>

                {/* Decorative Bottom */}

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent opacity-70" />

                <div className="absolute bottom-6 left-8 flex gap-2 opacity-40">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats */}

        <div className="mt-16 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="grid gap-8 md:grid-cols-4">

            <div>
              <div className="text-3xl font-bold text-slate-900">
                &lt;30%
              </div>
              <div className="mt-2 text-slate-500">
                Approval rate
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">
                7 days
              </div>
              <div className="mt-2 text-slate-500">
                Average hire
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">
                100%
              </div>
              <div className="mt-2 text-slate-500">
                Salary transparency
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">
                Verified
              </div>
              <div className="mt-2 text-slate-500">
                Identity & skills
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
