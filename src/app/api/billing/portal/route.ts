import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";

const portalRateLimiter = createRateLimiter("billing-portal", 10, "1 m");

function getAppUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
}

/*
 * POST /api/billing/portal
 * Opens the Dodo billing portal for the authenticated user's subscription.
 * Returns to /settings (seeker) or /recruiter/settings, matching the caller's role.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { success } = await portalRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { billingCustomerId: true },
  });
  if (!user?.billingCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }
  const appUrl = getAppUrl(req);
  const returnPath = session.user.role === UserRole.RECRUITER ? "/recruiter/settings" : "/settings";
  const portal = await dodo.customers.customerPortal.create(user.billingCustomerId, {
    return_url: `${appUrl}${returnPath}`,
  });
  return NextResponse.json({ data: { url: portal.link } }, { status: 200 });
}
