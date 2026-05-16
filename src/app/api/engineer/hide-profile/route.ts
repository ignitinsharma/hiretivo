import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { addDays } from "date-fns";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const HideProfileSchema = z.object({
  hide: z.boolean(),
  until: z.string().datetime().optional(), // ISO datetime; if omitted, defaults to +30 days
});

/*
 * POST /api/engineer/hide-profile
 * Sets or clears hiddenUntil on the engineer's User record.
 * hide=true: sets hiddenUntil = until ?? addDays(now, 30).
 * hide=false: clears hiddenUntil = null.
 * Effect is immediate — profile disappears from talent pool and /e/[slug] returns 404.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return new Response("Forbidden", { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = HideProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hiddenUntil = parsed.data.hide
    ? (parsed.data.until ? new Date(parsed.data.until) : addDays(new Date(), 30))
    : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hiddenUntil },
  });

  return NextResponse.json({ data: { hidden: parsed.data.hide, hiddenUntil: hiddenUntil?.toISOString() ?? null } });
}
