import { Sparkles, FileText, Zap, BarChart3 } from "lucide-react";

export default function WhyHiretivo() {
  const features = [
    {
      icon: Sparkles,
      title: "AI that writes like you",
      description:
        "Your resume rewritten per role — using your actual experience, not generic slop.",
      accent: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      icon: FileText,
      title: "Editable previews",
      description:
        "See every change before you download. Tweak, undo, perfect it — you stay in control.",
      accent: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Zap,
      title: "Done in 30 seconds",
      description:
        "Paste any job link → tailored resume. No templates, no forms, no friction.",
      accent: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      icon: BarChart3,
      title: "One dashboard, full view",
      description:
        "Track every application, cover letter, and resume from one place.",
      accent: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl font-bold tracking-tight text-brand-foreground">
            Why Hiretivo?
          </h2>
          <p className="mt-5 text-xl text-brand-foreground-muted">
            Your job search, supercharged — not replaced.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border border-brand-border bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30"
              >
                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-xl ${feature.accent}`}>
                  <Icon className={`h-8 w-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold leading-tight text-brand-foreground">
                  {feature.title}
                </h3>
                <div className="mt-5 h-1 w-12 rounded-full bg-brand-primary" />
                <p className="mt-6 text-base leading-relaxed text-brand-foreground-muted">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
