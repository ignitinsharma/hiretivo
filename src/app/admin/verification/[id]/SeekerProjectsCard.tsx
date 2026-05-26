import Link from "next/link";

/*
 * SeekerProjectsCard
 * Displays submitted projects as mini-cards with source/live links.
 * Returns null when no projects are submitted.
 */

interface ProjectItem {
  name?: string;
  description?: string;
  sourceUrl?: string;
  liveUrl?: string;
  url?: string;
}

interface SeekerProjectsCardProps {
  projects: ProjectItem[] | null | undefined;
}

export function SeekerProjectsCard({ projects }: SeekerProjectsCardProps) {
  if (!projects?.length) return null;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-3 font-semibold text-base leading-snug tracking-tight text-brand-foreground">
        Projects
      </h3>
      <div className="space-y-3">
        {projects.map((project, index) => (
          <div
            key={`${project.name ?? "project"}-${index}`}
            className="rounded-lg border border-brand-border bg-brand-surface p-4"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-medium text-brand-foreground">
                {project.name ?? "Untitled project"}
              </p>
              {(project.sourceUrl ?? project.url) && (
                <Link
                  href={project.sourceUrl ?? project.url!}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="shrink-0 text-xs font-medium text-brand-primary hover:underline"
                >
                  View source &rarr;
                </Link>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-xs leading-relaxed text-brand-foreground-muted">
                {project.description}
              </p>
            )}
            {project.liveUrl && (
              <Link
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 inline-flex text-xs font-medium text-brand-primary hover:underline"
              >
                View live &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
