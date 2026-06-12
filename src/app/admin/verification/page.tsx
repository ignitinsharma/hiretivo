import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";

/*
 * /admin/verification
 * Server component queue list. Fetches all PENDING and IN_REVIEW engineers directly
 * from the database. Renders a table with a View link to the individual review page.
 * Layout is wrapped by the parent /admin/layout.tsx which handles auth + AdminShell.
 */
export default async function AdminVerificationPage() {
  const users = await prisma.user.findMany({
    where: {
      role: "SEEKER",
      verificationStatus: { in: ["PENDING", "IN_REVIEW"] },
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
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-brand-foreground">Verification queue</h1>
          <p className="text-sm text-brand-foreground-muted mt-1">
            Engineers awaiting review — {users.length} pending
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
              <thead className="bg-brand-surface text-left text-xs uppercase tracking-wider text-brand-foreground-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const submittedAt = u.seekerProfile?.submittedForReviewAt;
                  return (
                    <tr key={u.id} className="border-t border-brand-border">
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
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Pending Review
                        </span>
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
    </div>
  );
}
