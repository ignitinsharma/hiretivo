import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter, dataFetchRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Generic email domains that cannot be blocked as company domains
const GENERIC_DOMAINS = new Set([
  "gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com",
  "live.com", "msn.com", "aol.com", "protonmail.com", "mail.com",
]);

/*
 * normalizeDomain
 * Strips subdomains, lowercases, and validates the result.
 * Returns normalized domain string or null if invalid/generic.
 * Example: "us.acme.com" -> "acme.com"
 */
function normalizeDomain(raw: string): string | null {
  try {
    const parts = raw.toLowerCase().trim().split(".");
    if (parts.length < 2) return null;
    // Take last two parts: "acme.com" from "us.acme.com"
    const normalized = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (GENERIC_DOMAINS.has(normalized)) return null;
    return normalized;
  } catch {
    return null;
  }
}

const BlockSchema = z.object({
  recruiterDomain: z.string().min(3).max(100),
});

/*
 * POST /api/engineer/block-recruiter
 * Creates BlockedRecruiter(engineerId, recruiterDomain).
 * Normalizes domain before storing. Rejects generic email domains.
 * Idempotent — existing block record is a no-op.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return new Response("Forbidden", { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = BlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const domain = normalizeDomain(parsed.data.recruiterDomain);
  if (!domain) {
    return NextResponse.json({ error: "Invalid or generic domain" }, { status: 400 });
  }

  await prisma.blockedRecruiter.upsert({
    where: { engineerId_recruiterDomain: { engineerId: session.user.id, recruiterDomain: domain } },
    update: {},
    create: { engineerId: session.user.id, recruiterDomain: domain },
  });

  return NextResponse.json({ data: { blocked: domain } });
}

/*
 * GET /api/engineer/block-recruiter
 * Returns:
 * - blockedDomains: list of currently blocked recruiter domains
 * - whoViewedMe: list of recruiters who unlocked this engineer (from EngineerUnlock)
 *   Each entry: { companyName, companyDomain, unlockedAt }
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return new Response("Forbidden", { status: 403 });

  const ip = getRateLimitIp(req);
  const { success } = await dataFetchRateLimiter.limit(ip);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const [blocked, unlocks] = await Promise.all([
    prisma.blockedRecruiter.findMany({
      where: { engineerId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { recruiterDomain: true, createdAt: true },
    }),
    prisma.engineerUnlock.findMany({
      where: { engineerId: session.user.id },
      orderBy: { unlockedAt: "desc" },
      take: 50,
      select: {
        unlockedAt: true, source: true,
        recruiter: {
          select: {
            recruiterProfile: { select: { companyName: true, website: true } },
          },
        },
      },
    }),
  ]);

  const whoViewedMe = unlocks.map((u) => {
    const website = u.recruiter.recruiterProfile?.website ?? "";
    const domain = normalizeDomain(website.replace(/^https?:\/\//, "").split("/")[0] ?? "") ?? website;
    return {
      companyName: u.recruiter.recruiterProfile?.companyName ?? "Unknown",
      companyDomain: domain,
      unlockedAt: u.unlockedAt.toISOString(),
      source: u.source,
    };
  });

  return NextResponse.json({
    data: {
      blockedDomains: blocked.map((b) => ({ domain: b.recruiterDomain, blockedAt: b.createdAt.toISOString() })),
      whoViewedMe,
    },
  });
}
