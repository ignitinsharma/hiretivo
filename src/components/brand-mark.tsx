import { cn } from "@/lib/cn";

/** Hiretivo's decorative "H" mark, using the current palette. Pair it with the name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="64" height="64" rx="14.08" className="fill-primary" />
      <g className="fill-on-primary">
        <rect x="16" y="14" width="8" height="36" rx="2" />
        <rect x="40" y="14" width="8" height="36" rx="2" />
        <rect x="16" y="28" width="32" height="8" rx="2" />
      </g>
    </svg>
  );
}
