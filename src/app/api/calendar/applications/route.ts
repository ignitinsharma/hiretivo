import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter("calendar-applications", 30, "1 m");

/* Lists the current user's applications for the calendar event picker. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await limiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const data = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: { id: true, job: { select: { title: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}
