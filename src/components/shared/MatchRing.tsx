interface MatchRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<MatchRingProps['size']>, string> = {
  sm: 'h-10 w-10 text-[10px]',
  md: 'h-14 w-14 text-xs',
  lg: 'h-20 w-20 text-base',
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* MatchRing
 * SVG circular progress ring showing a seeker's match % for a job. Pure brand-token
 * colors (no new palette): ring = brand-primary, track = brand-border.
 * @param score - match percentage (0-100)
 * @param size - visual size, defaults to 'md' */
export function MatchRing({ score, size = 'md' }: MatchRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className={`relative shrink-0 ${SIZE_CLASSES[size]}`} role="img" aria-label={`${clamped}% match`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="text-brand-border" stroke="currentColor" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-brand-primary"
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-semibold text-brand-foreground">
        {clamped}%
      </span>
    </div>
  );
}
