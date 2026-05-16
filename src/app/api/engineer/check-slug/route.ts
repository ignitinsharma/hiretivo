import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter, getRateLimitIp } from "@/lib/rate-limit";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "pricing",
  "jobs",
  "engineers",
  "recruiter",
  "seeker",
  "login",
  "signup",
  "dashboard",
  "health",
  "feedback",
  "e",
  "app",
  "www",
  "support",
  "help",
  "about",
  "blog",
  "terms",
  "privacy",
  "careers",
  "hire",
  "hiretivo",
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/*
 * findSlugSuggestion
 * Finds the first available numeric suffix for a valid slug base.
 * Returns undefined after suffix 99 to cap DB lookups under abuse.
 */
async function findSlugSuggestion(slug: string): Promise<string | undefined> {
  for (let suffix = 2; suffix <= 99; suffix += 1) {
    const candidate = `${slug}${suffix}`;
    if (candidate.length > 30) return undefined;

    const taken = await prisma.user.findFirst({
      where: { profileSlug: candidate },
      select: { id: true },
    });
    if (!taken && !RESERVED_SLUGS.has(candidate)) return candidate;
  }

  return undefined;
}

/*
 * GET /api/engineer/check-slug
 * Checks authenticated engineer profile slug availability.
 * Returns { available: boolean, suggestion?: string } for form debouncing.
 */
export async function GET(req: NextRequest) {
  const ip = getRateLimitIp(req);
  const { success } = await dataFetchRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase() ?? "";
  if (!slug || slug.length < 3 || slug.length > 30 || !SLUG_REGEX.test(slug)) {
    return NextResponse.json({ available: false });
  }

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({
      available: false,
      suggestion: await findSlugSuggestion(slug),
    });
  }

  const existing = await prisma.user.findFirst({
    where: { profileSlug: slug, NOT: { id: session.user.id } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ available: true });
  }

  return NextResponse.json({
    available: false,
    suggestion: await findSlugSuggestion(slug),
  });
}
