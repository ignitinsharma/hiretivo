import { isAfter } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { applyRateLimiter, dataFetchRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import {
  CodingProfilesSchema,
  normalizeCodingProfiles,
} from "@/lib/verification/coding-profiles";
import { getVerificationReadiness } from "@/lib/verification/readiness";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const verificationSubmitSchema = z.object({
  githubUrl: z
    .string()
    .regex(/^https:\/\/github\.com\/.+/, "Must be a valid GitHub profile URL"),
  codingProfiles: CodingProfilesSchema.optional(),
  videoIntroUrl: z.string().url().startsWith("https://").optional().nullable(),
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
      name: true,
      image: true,
      timezone: true,
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
          bio: true,
          primaryRole: true,
          yearsExperience: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          topProjects: true,
          skills: { select: { id: true } },
          workExperiences: { select: { id: true } },
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
    readiness: getVerificationReadiness(user),
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

  const { githubUrl, videoIntroUrl } = parsed.data;
  const codingProfiles = normalizeCodingProfiles(parsed.data.codingProfiles);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      timezone: true,
      verificationStatus: true,
      reapplyAfter: true,
      seekerProfile: {
        select: {
          bio: true,
          primaryRole: true,
          yearsExperience: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          topProjects: true,
          codingProfiles: true,
          skills: { select: { id: true } },
          workExperiences: { select: { id: true } },
        },
      },
    },
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

  const readiness = getVerificationReadiness(user);
  if (!readiness.isReady) {
    return NextResponse.json(
      {
        error: "Complete your profile before submitting for verification.",
        readiness,
      },
      { status: 400 },
    );
  }

  const githubUsername = githubUrl
    .replace("https://github.com/", "")
    .split("/")[0];

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        verificationStatus: VerificationStatus.PENDING,
        reapplyAfter: null,
      },
    }),
    prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        githubUsername,
        githubUrl,
        codingProfiles,
        videoIntroUrl: videoIntroUrl ?? null,
      },
      update: {
        githubUsername,
        githubUrl,
        codingProfiles,
        videoIntroUrl: videoIntroUrl ?? null,
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
  const safeLegalName = escapeHtml(user.name ?? "Engineer");
  const safeGithubUsername = escapeHtml(githubUsername);
  const safeGithubUrl = escapeHtml(githubUrl);
  sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to: adminEmail,
    subject: `New verification submission: ${user.name ?? "Engineer"} (@${githubUsername})`,
    html: `<p>New engineer verification submitted.</p>
      <p><strong>Name:</strong> ${safeLegalName}<br>
      <strong>GitHub:</strong> <a href="${safeGithubUrl}">${safeGithubUrl}</a></p>
      <p><strong>GitHub username:</strong> @${safeGithubUsername}</p>
      <p><a href="${appUrl}/admin/verification">Review in admin queue</a></p>`,
  }).catch((error) => {
    console.error("[engineer verification] Admin email failed:", error);
  });

  return NextResponse.json(
    { success: true, message: "Under review - we'll email you within 48 hours." },
    { status: 201 },
  );
}
