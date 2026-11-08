import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";
import { calendarEventSchema } from "@/lib/validations/calendar-event";

const writeLimiter = createRateLimiter("calendar-write", 10, "1 m");
interface EventContext { params: Promise<{ id: string }> }

/* Changes an event only when its application belongs to the current user. */
export async function PATCH(request: Request, context: EventContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await writeLimiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id } = await context.params;
  const existing = await prisma.calendarEvent.findFirst({ where: { id, application: { seekerId: session.user.id } }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = calendarEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event details" }, { status: 400 });
  const data = await prisma.calendarEvent.update({ where: { id }, data: { ...parsed.data, startsAt: new Date(parsed.data.startsAt) } });
  return NextResponse.json({ data });
}

/* Removes an event only when its application belongs to the current user. */
export async function DELETE(_request: Request, context: EventContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await writeLimiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id } = await context.params;
  const existing = await prisma.calendarEvent.findFirst({ where: { id, application: { seekerId: session.user.id } }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
