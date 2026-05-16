import { isAfter } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { applyRateLimiter, dataFetchRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

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

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  url: z.string().url().startsWith("https://"),
});

const verificationSubmitSchema = z.object({
  githubUrl: z
    .string()
    .regex(/^https:\/\/github\.com\/.+/, "Must be a valid GitHub profile URL"),
  legalName: z.string().trim().min(2).max(100),
  bio: z
    .string()
    .trim()
    .max(5000)
    .refine(
      (value) => value.split(/\s+/).filter(Boolean).length >= 100,
      "Bio must be at least 100 words",
    ),
  topProjects: z.array(projectSchema).min(1).max(3),
  videoIntroUrl: z.string().url().startsWith("https://").optional().nullable(),
  profileSlug: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with hyphens; no leading/trailing hyphens",
    ),
});

/*
 * GET /api/engineer/verification
 * Returns the authenticated engineer's verification state and latest review.
 * Response includes public-profile consent metadata for dashboard status cards.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      verificationStatus: true,
      hiretivoScore: true,
      reapplyAfter: true,
      profileSlug: true,
      verificationReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          scoreGiven: true,
          notes: true,
          createdAt: true,
        },
      },
      seekerProfile: {
        select: {
          profilePublic: true,
          profilePublicConsentAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    verificationStatus: user.verificationStatus,
    hiretivoScore: user.hiretivoScore,
    reapplyAfter: user.reapplyAfter,
    profileSlug: user.profileSlug,
    profilePublic: user.seekerProfile?.profilePublic ?? false,
    profilePublicConsentAt: user.seekerProfile?.profilePublicConsentAt ?? null,
    lastReview: user.verificationReviews[0] ?? null,
  });
}

/*
 * POST /api/engineer/verification
 * Submits Phase B verification for an authenticated SEEKER.
 * Persists submission data, sets status to PENDING, creates an audit review,
 * and sends a non-blocking admin notification email.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await applyRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verificationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { githubUrl, legalName, bio, topProjects, videoIntroUrl, profileSlug } =
    parsed.data;
  const normalizedSlug = profileSlug.toLowerCase();

  if (RESERVED_SLUGS.has(normalizedSlug)) {
    return NextResponse.json(
      { error: "That slug is reserved. Please choose a different one." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true, reapplyAfter: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user.reapplyAfter && isAfter(user.reapplyAfter, new Date())) {
    return NextResponse.json(
      { error: "Too soon to reapply", reapplyAfter: user.reapplyAfter },
      { status: 429 },
    );
  }

  const canSubmit =
    user.verificationStatus === VerificationStatus.NOT_SUBMITTED ||
    user.verificationStatus === VerificationStatus.REJECTED;
  if (!canSubmit) {
    return NextResponse.json(
      { error: "Verification already in progress or completed" },
      { status: 409 },
    );
  }

  const slugTaken = await prisma.user.findFirst({
    where: { profileSlug: normalizedSlug, NOT: { id: session.user.id } },
    select: { id: true },
  });
  if (slugTaken) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const githubUsername = githubUrl
    .replace("https://github.com/", "")
    .split("/")[0];

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: legalName,
        verificationStatus: VerificationStatus.PENDING,
        profileSlug: normalizedSlug,
        reapplyAfter: null,
      },
    }),
    prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bio,
        githubUsername,
        videoIntroUrl: videoIntroUrl ?? null,
        topProjects,
      },
      update: {
        bio,
        githubUsername,
        videoIntroUrl: videoIntroUrl ?? null,
        topProjects,
        verificationNotes: null,
        verificationReviewedAt: null,
        verificationReviewedBy: null,
      },
    }),
    prisma.verificationReview.create({
      data: {
        userId: session.user.id,
        status: VerificationStatus.PENDING,
      },
    }),
  ]);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@hiretivo.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hiretivo.com";
  sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to: adminEmail,
    subject: `New verification submission: ${legalName} (@${githubUsername})`,
    html: `<p>New engineer verification submitted.</p>
      <p><strong>Name:</strong> ${legalName}<br>
      <strong>GitHub:</strong> <a href="${githubUrl}">${githubUrl}</a><br>
      <strong>Slug:</strong> hiretivo.com/e/${normalizedSlug}</p>
      <p><a href="${appUrl}/admin/verification">Review in admin queue</a></p>`,
  }).catch((error) => {
    console.error("[engineer verification] Admin email failed:", error);
  });

  return NextResponse.json(
    { success: true, message: "Under review - we'll email you within 48 hours." },
    { status: 201 },
  );
}
