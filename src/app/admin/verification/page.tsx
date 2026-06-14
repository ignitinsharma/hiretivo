import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { VERIFICATION_STATUS_DISPLAY } from "@/modules/admin/utils/status-display";
import { AdminBadge } from "@/modules/admin/components/AdminBadge";
import { PaginationControls } from "@/components/shared/PaginationControls";

/*
 * /admin/verification
 * Server component queue list. Fetches a server-side bounded (skip/take) page of
 * PENDING and IN_REVIEW engineers with a NaN-guarded ?page param, rendering a table
 * with a View link to the individual review page plus Prev/Next pagination controls.
 * Layout is wrapped by the parent /admin/layout.tsx which handles auth + AdminShell.
 */
export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const rawPage = searchParams.page;
  const parsed = parseInt(rawPage ?? "1", 10);
  const page = Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  const PAGE_SIZE = 25;

  const users = await prisma.user.findMany({
    where: {
      role: UserRole.SEEKER,
      verificationStatus: {
        in: [VerificationStatus.PENDING, VerificationStatus.IN_REVIEW],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      verificationStatus: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          submittedForReviewAt: true,
        },
      },
    },
    orderBy: { seekerProfile: { submittedForReviewAt: "asc" } },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const total = await prisma.user.count({
    where: {
      role: UserRole.SEEKER,
      verificationStatus: {
        in: [VerificationStatus.PENDING, VerificationStatus.IN_REVIEW],
      },
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page * PAGE_SIZE < total;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-brand-foreground">Verification queue</h1>
          <p className="text-sm text-brand-foreground-muted mt-1">
            Engineers awaiting review — {total} pending
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-white">
        {users.length === 0 ? (
          <div className="p-10 text-center text-brand-foreground-muted">
            No engineers awaiting review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-brand-border bg-brand-surface text-left text-xs uppercase tracking-wider text-brand-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const submittedAt = u.seekerProfile?.submittedForReviewAt;
                  const statusDisplay =
                    VERIFICATION_STATUS_DISPLAY[
                      u.verificationStatus as VerificationStatus
                    ];
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-brand-border transition-colors hover:bg-brand-surface"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar
                            name={u.name}
                            email={u.email}
                            userId={u.id}
                            image={u.image}
                            size="md"
                            className="shrink-0"
                          />
                          <span className="text-sm font-medium text-brand-foreground">
                            {u.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-foreground-muted">
                        {u.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-foreground-muted">
                        {u.seekerProfile?.primaryRole ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-foreground-muted">
                        {submittedAt
                          ? format(new Date(submittedAt), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge
                          label={statusDisplay.label}
                          className={statusDisplay.badge}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/verification/${u.id}`}
                          className="text-sm font-medium text-brand-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaginationControls
        basePath="/admin/verification"
        page={page}
        totalPages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  );
}
