import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

/*
 * SeekerGitHubCard
 * Displays GitHub analysis with score circle, username link, and AI analysis summary.
 * Returns null when no GitHub username is set.
 * Score is color-coded: green >= 70, amber 40-69, red < 40.
 */

interface SeekerGitHubCardProps {
  username: string | null | undefined;
  score: number | null | undefined;
  analysis: unknown;
  scannedAt: Date | string | null | undefined;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-700";
  if (score >= 40) return "text-amber-700";
  return "text-red-700";
}

function getScoreBorder(score: number): string {
  if (score >= 70) return "border-green-300 bg-green-50";
  if (score >= 40) return "border-amber-300 bg-amber-50";
  return "border-red-300 bg-red-50";
}

export function SeekerGitHubCard({
  username,
  score,
  analysis,
  scannedAt,
}: SeekerGitHubCardProps) {
  if (!username) return null;

  const analysisText =
    typeof analysis === "object" && analysis !== null
      ? ((analysis as Record<string, unknown>).summary as string) ??
        ((analysis as Record<string, unknown>).analysis as string) ??
        null
      : typeof analysis === "string"
        ? analysis
        : null;

  const hasContent = score != null || analysisText || scannedAt;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-3 font-semibold text-base leading-snug tracking-tight text-brand-foreground">
        GitHub Analysis
      </h3>

      <div className="flex items-start gap-4">
        {/* Score circle */}
        {score != null && (
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold ${getScoreBorder(score)} ${getScoreColor(score)}`}
          >
            {score}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Username */}
          <Link
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
          >
            @{username}
            <ExternalLink className="h-3 w-3" />
          </Link>

          {/* Analysis summary */}
          {analysisText && (
            <p className="mt-1 text-xs leading-relaxed text-brand-foreground-muted">
              {analysisText}
            </p>
          )}

          {/* Help text when there's no analysis data yet */}
          {!hasContent && (
            <p className="mt-1 text-xs text-brand-foreground-secondary">
              GitHub scan pending or unavailable.
            </p>
          )}

          {/* Scanned timestamp */}
          {scannedAt && (
            <p className="mt-2 text-xs text-brand-foreground-secondary">
              Scanned {format(new Date(scannedAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
