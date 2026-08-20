import { prisma } from "@/lib/prisma";

/*
 * touchLastActive — throttled active-signal write.
 * No-op when lastActiveAt was written <1h ago; the where-clause makes the
 * update cheap and race-free without a read first.
 */
export async function touchLastActive(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { lastActiveAt: null },
        { lastActiveAt: { lt: new Date(Date.now() - 3600_000) } },
      ],
    },
    data: { lastActiveAt: new Date() },
  });
}