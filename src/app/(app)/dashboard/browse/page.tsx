import { JobStatus } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { FeedView } from '@/modules/seeker/feed/components/FeedView';
import { AddLinkCard } from '@/modules/seeker/apply/components/AddLinkCard';

/*
 * BrowseJobsPage
 * Server shell for the match-ranked job feed (canonical Browse route, `(app)` group).
 * Fetches the distinct company list server-side (degrades to []) so FeedFilterBar's
 * companies multiselect has no flash. Replaces the retired /seeker/feed page.
 */
export default async function BrowseJobsPage() {
  const companies = await prisma.job
    .findMany({
      where: { status: JobStatus.OPEN, companyName: { not: null } },
      select: { companyName: true },
      distinct: ['companyName'],
      take: 200,
    })
    .then((rows) =>
      rows
        .map((r) => r.companyName)
        .filter((name): name is string => Boolean(name))
        .sort((a, b) => a.localeCompare(b)),
    )
    .catch(() => [] as string[]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-foreground tracking-tight">Browse jobs</h1>
        <p className="mt-2 text-lg text-brand-foreground-muted">Match-ranked jobs, filtered your way.</p>
      </div>
      <div className="mb-6">
        <AddLinkCard />
      </div>
      <FeedView companies={companies} />
    </div>
  );
}
