import * as React from "react";
import type { LucideIcon } from "lucide-react";

export interface AuthValueBlurb {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthValuePanelProps {
  headline: React.ReactNode;
  subtitle: string;
  blurbs: AuthValueBlurb[];
  footer?: React.ReactNode;
}

export function AuthValuePanel({
  headline,
  subtitle,
  blurbs,
  footer,
}: AuthValuePanelProps) {
  return (
    <>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-brand-primary opacity-[0.04] blur-3xl" />

      <div className="relative z-10 max-w-lg w-full">
        <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-brand-foreground mb-6">
          {headline}
        </h1>
        <p className="text-brand-foreground-muted font-medium text-base leading-relaxed mb-8 max-w-md">
          {subtitle}
        </p>

        <ul className="space-y-3 max-w-md">
          {blurbs.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-xl border border-brand-border bg-white p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand-foreground">{title}</p>
                <p className="text-sm leading-relaxed text-brand-foreground-muted">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </>
  );
}
