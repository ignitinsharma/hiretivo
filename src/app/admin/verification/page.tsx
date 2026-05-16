import { subHours } from "date-fns";

import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { VerificationQueue } from "@/modules/admin-verification/components/VerificationQueue";

export const revalidate = 0;

/*
 * AdminVerificationPage
 * Lists pending and in-review verification submissions in FIFO order.
 */
export default async function AdminVerificationPage() {
  const staleThreshold = subHours(new Date(), 2);

  await prisma.user.updateMany({
    where: {
      verificationStatus: VerificationStatus.IN_REVIEW,
      updatedAt: { lt: staleThreshold },
    },
    data: { verificationStatus: VerificationStatus.PENDING },
  });

  const submissions = await prisma.user.findMany({
    where: {
      verificationStatus: {
        in: [VerificationStatus.PENDING, VerificationStatus.IN_REVIEW],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      verificationStatus: true,
      profileSlug: true,
      updatedAt: true,
      createdAt: true,
      seekerProfile: {
        select: {
          headline: true,
          primaryRole: true,
          githubUsername: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
        },
      },
      verificationReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, status: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground">
          Verification Queue
        </h1>
        <p className="mt-2 text-sm text-brand-foreground-muted">
          {submissions.length}{" "}
          {submissions.length === 1 ? "submission" : "submissions"} pending
          review.
        </p>
      </div>

      <VerificationQueue submissions={submissions} />
    </main>
  );
}
