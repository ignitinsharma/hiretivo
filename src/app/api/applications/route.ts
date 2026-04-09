import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { createApplicationSchema } from "@/lib/validations/application";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { jobId, coverLetter } = parsed.data;

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.OPEN },
    select: { id: true, recruiterId: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
  }

  const existingApplication = await prisma.application.findUnique({
    where: {
      jobId_seekerId: {
        jobId,
        seekerId: session.user.id,
      },
    },
    select: { id: true },
  });

  if (existingApplication) {
    return NextResponse.json(
      { error: "You have already applied to this job" },
      { status: 409 },
    );
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  let matchScore = 0;
  if (seekerProfile) {
    const jobMatch = await prisma.jobMatch.findUnique({
      where: {
        jobId_seekerProfileId: {
          jobId,
          seekerProfileId: seekerProfile.id,
        },
      },
    });
    matchScore = jobMatch?.score ?? 0;
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      seekerId: session.user.id,
      status: ApplicationStatus.APPLIED,
      coverLetter: coverLetter ?? null,
      matchScore,
    },
  });

  return NextResponse.json(application, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: {
      id: true,
      jobId: true,
      status: true,
      createdAt: true,
      job: {
        select: {
          title: true,
          recruiter: {
            select: {
              recruiterProfile: {
                select: {
                  companyName: true,
                  logo: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    applications.map((application) => ({
      id: application.id,
      jobId: application.jobId,
      jobTitle: application.job.title,
      companyName:
        application.job.recruiter.recruiterProfile?.companyName ?? "Unknown Company",
      companyLogoUrl: application.job.recruiter.recruiterProfile?.logo ?? null,
      status: application.status,
      appliedAt: application.createdAt.toISOString(),
    })),
  );
}
