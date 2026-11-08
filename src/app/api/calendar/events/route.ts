import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";
import { createCalendarEventSchema } from "@/lib/validations/calendar-event";

const readLimiter = createRateLimiter("calendar-read", 30, "1 m");
const writeLimiter = createRateLimiter("calendar-write", 10, "1 m");
const monthPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

/* Lists the current user's events across the visible month grid, including adjacent days. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await readLimiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const month = new URL(request.url).searchParams.get("month") ?? "";
  const match = monthPattern.exec(month);
  if (!match) return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  const year = Number(match[1]);
  const index = Number(match[2]) - 1;
  const data = await prisma.calendarEvent.findMany({
    where: { application: { seekerId: session.user.id }, startsAt: { gte: new Date(Date.UTC(year, index, -7)), lt: new Date(Date.UTC(year, index + 1, 8)) } },
    include: { application: { select: { job: { select: { title: true, companyName: true } } } } },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ data });
}

/* Saves an interview or deadline on an application owned by the current user. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await writeLimiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createCalendarEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event details" }, { status: 400 });
  const application = await prisma.application.findFirst({ where: { id: parsed.data.applicationId, seekerId: session.user.id }, select: { id: true } });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  const data = await prisma.calendarEvent.create({ data: { ...parsed.data, startsAt: new Date(parsed.data.startsAt) } });
  return NextResponse.json({ data }, { status: 201 });
}
