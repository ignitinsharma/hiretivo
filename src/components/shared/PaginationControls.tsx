import Link from "next/link";

interface PaginationControlsProps {
  basePath: string;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

const LINK_BASE =
  "rounded-lg border border-brand-border px-3 py-2 text-sm font-medium";
const LINK_ACTIVE = "bg-white text-brand-foreground hover:bg-brand-surface";
const LINK_DISABLED = "bg-brand-surface text-brand-foreground-secondary";

/*
 * PaginationControls
 * Server-side Prev/Next offset pagination for admin list pages.
 * @param basePath - route path the page query is appended to (e.g. "/admin/companies").
 * @param page - current 1-based page number.
 * @param totalPages - total page count for the "Page X of Y" label.
 * @param hasPrev/hasNext - whether the adjacent pages exist (disables the control otherwise).
 */
export function PaginationControls({
  basePath,
  page,
  totalPages,
  hasPrev,
  hasNext,
}: PaginationControlsProps) {
  const controls = [
    { label: "Previous", enabled: hasPrev, target: page - 1 },
    { label: "Next", enabled: hasNext, target: page + 1 },
  ];

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-brand-foreground-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {controls.map(({ label, enabled, target }) =>
          enabled ? (
            <Link
              key={label}
              href={`${basePath}?page=${target}`}
              className={`${LINK_BASE} ${LINK_ACTIVE}`}
            >
              {label}
            </Link>
          ) : (
            <span key={label} className={`${LINK_BASE} ${LINK_DISABLED}`}>
              {label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
