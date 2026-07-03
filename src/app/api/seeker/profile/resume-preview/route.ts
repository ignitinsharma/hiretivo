import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { renderResumePdf } from "@/lib/resume/render";
import { mapProfileToResumeDocument } from "@/lib/resume/map-profile-to-resume";
import { storeResumePdf } from "@/lib/resume/store";
import { getSignedFileUrl } from "@/lib/r2";

const resumePreviewRateLimiter = createRateLimiter("seeker-resume-preview", 10, "1 m");

/*
 * POST /api/seeker/profile/resume-preview
 * Renders the seeker's current profile into an ATS-safe PDF (Phase 3b
 * renderer), uploads it to R2, and returns a signed preview URL.
 * @returns { data: { url } } or auth/rate-limit/not-found errors
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await resumePreviewRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      seekerProfile: {
        select: {
          id: true,
          headline: true,
          bio: true,
          location: true,
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          topProjects: true,
          workExperiences: { orderBy: { createdAt: "asc" as const } },
          educations: { orderBy: { createdAt: "asc" as const } },
          skills: { include: { skill: { select: { name: true, category: true } } } },
          certifications: { orderBy: { createdAt: "asc" as const } },
        },
      },
    },
  });

  if (!user?.seekerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { seekerProfile } = user;
  const document = mapProfileToResumeDocument({
    fullName: user.name ?? "",
    email: user.email ?? undefined,
    profile: {
      headline: seekerProfile.headline,
      bio: seekerProfile.bio,
      location: seekerProfile.location,
      websiteUrl: seekerProfile.websiteUrl,
      linkedinUrl: seekerProfile.linkedinUrl,
      githubUrl: seekerProfile.githubUrl,
      topProjects: seekerProfile.topProjects,
    },
    skills: seekerProfile.skills.map((s) => s.skill),
    experiences: seekerProfile.workExperiences,
    educations: seekerProfile.educations,
    certifications: seekerProfile.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer ?? undefined,
      issueDate: cert.issueDate ?? undefined,
    })),
  });

  const pdf = await renderResumePdf(document);
  const { key } = await storeResumePdf(seekerProfile.id, pdf);
  const url = await getSignedFileUrl(key);

  return NextResponse.json({ data: { url } }, { status: 200 });
}
