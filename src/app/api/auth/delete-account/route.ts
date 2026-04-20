import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const deleteAccountRateLimiter = createRateLimiter("delete-account", 3, "1 m");

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { success } = await deleteAccountRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Soft-delete: anonymise the account rather than hard-delete to preserve FK integrity
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: "Deleted User",
      email: `deleted-${session.user.id}@hiretivo.invalid`,
      passwordHash: null,
      image: null,
    },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
