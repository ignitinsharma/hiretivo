import type { LucideIcon } from "lucide-react";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tag?: string;
}

/*
 * PlaceholderScreen
 * Empty-state screen for routes stubbed in Phase 1b (shell scaffolding).
 * Later phases replace each page body with real content.
 * @param title       - screen heading
 * @param description - one-line explanation of what will live here
 * @param icon        - Lucide icon for the empty-state medallion
 * @param tag         - optional status pill, e.g. "coming soon" / "beta"
 */
export function PlaceholderScreen({
  title,
  description,
  icon: Icon,
  tag,
}: PlaceholderScreenProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-primary">
        <Icon className="h-7 w-7" />
      </div>
      {tag && (
        <span className="mb-3 inline-flex items-center rounded-lg border border-brand-border bg-brand-surface px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-foreground-muted">
          {tag}
        </span>
      )}
      <h1 className="font-bold text-2xl md:text-3xl leading-snug tracking-tight text-brand-foreground">
        {title}
      </h1>
      <p className="mt-2 font-normal text-base leading-relaxed text-brand-foreground-muted">
        {description}
      </p>
    </div>
  );
}
