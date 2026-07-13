import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ApplyFromLinkSchema,
  ApplyFromTextSchema,
  type JobPreview,
} from "@/lib/validations/apply-from-link.schema";
import { parseJobFromUrl, parseJobFromText } from "@/lib/ai/jd-parser";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.pastedText) {
    const parsed = ApplyFromTextSchema.safeParse({
      title: body.title ?? "",
      company: body.company ?? "",
      description: body.pastedText,
      previewOnly: body.previewOnly ?? false,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const jobData = await parseJobFromText(parsed.data.description);
    if (!jobData) {
      return NextResponse.json(
        { error: "Could not parse job description. Please ensure it includes the job title, company, and responsibilities." },
        { status: 422 },
      );
    }

    const preview: JobPreview = {
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      skills: jobData.skills,
    };

    if (parsed.data.previewOnly) {
      return NextResponse.json({ preview });
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: session.user.id,
        title: jobData.title,
        description: jobData.description,
        jobType: "FULL_TIME",
        applyType: "EXTERNAL",
        status: "PUBLIC",
        companyName: jobData.company,
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        seekerId: session.user.id,
        status: "APPLIED",
        matchScore: 0,
      },
    });

    return NextResponse.json({
      preview,
      applicationId: application.id,
      jobId: job.id,
    });
  }

  const parsed = ApplyFromLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { url, previewOnly } = parsed.data;

  const existing = await prisma.application.findFirst({
    where: { seekerId: session.user.id },
    include: { job: { select: { externalApplyUrl: true } } },
  });

  if (existing?.job?.externalApplyUrl === url) {
    return NextResponse.json(
      { error: "You have already applied to this job from this link." },
      { status: 409 },
    );
  }

  const jobData = await parseJobFromUrl(url);
  if (!jobData) {
    return NextResponse.json(
      { error: "Could not parse job from this URL. Try pasting the job description instead." },
      { status: 422 },
    );
  }

  const preview: JobPreview = {
    title: jobData.title,
    company: jobData.company,
    description: jobData.description,
    skills: jobData.skills,
  };

  if (previewOnly) {
    return NextResponse.json({ preview });
  }

  const job = await prisma.job.create({
    data: {
      recruiterId: session.user.id,
      title: jobData.title,
      description: jobData.description,
      jobType: "FULL_TIME",
      applyType: "EXTERNAL",
      status: "PUBLIC",
      externalApplyUrl: url,
      companyName: jobData.company,
    },
  });

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      seekerId: session.user.id,
      status: "APPLIED",
      matchScore: 0,
    },
  });

  return NextResponse.json({
    preview,
    applicationId: application.id,
    jobId: job.id,
  });
}
