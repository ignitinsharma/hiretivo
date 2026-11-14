import { NextResponse } from "next/server";

import { isAiConfigured } from "@/lib/ai/config";
import { discardProfileImports, importProfileJob } from "@/lib/jobs/import-profile";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings-data";
import { withCreationLock } from "@/lib/jobs/creation-lock";
import { startJob } from "@/lib/jobs/runner";
import { RESUME_MAX_BYTES, RESUME_MESSAGES, resumeText } from "@/lib/resume-text";
import { route } from "@/lib/route";

/**
 * Starts a profile import from a resume file, sent as the request body (E4-10):
 * its text is read here, then a job sorts it into a profile. Earlier readings
 * are deleted first, so only one resume's text is kept at a time. A route
 * handler, since Server Actions take at most 1 MB.
 */
export const POST = route(async (request) => {
  if (Number(request.headers.get("content-length") ?? 0) > RESUME_MAX_BYTES) {
    return NextResponse.json({ error: RESUME_MESSAGES.tooBig }, { status: 413 });
  }
  if (!(await isAiConfigured())) {
    return NextResponse.json({ error: "Choose an AI provider in Settings first: it's what reads the resume." }, { status: 409 });
  }
  const read = await resumeText(new Uint8Array(await request.arrayBuffer()));
  if (!read.ok) return NextResponse.json({ error: read.error }, { status: 400 });
  const jobId = await withCreationLock(async () => {
    const settings = await loadSettings();
    const existing = await prisma.job.findFirst({ where: { type: "import-profile", OR: [{ status: { in: ["QUEUED", "RUNNING"] } }, { finishedAt: { gte: new Date(Date.now() - settings.jobRetentionHours * 3_600_000) } }, { finishedAt: null, updatedAt: { gte: new Date(Date.now() - settings.jobRetentionHours * 3_600_000) } }] }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (existing) return existing.id;
    await discardProfileImports();
    return startJob(importProfileJob, { resume: read.text }, { key: "profile-import" });
  });
  return NextResponse.json({ jobId });
});
