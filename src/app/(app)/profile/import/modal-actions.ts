"use server";
import { z } from "zod";
import { action } from "@/lib/action";
import { isAiConfigured, loadAiConfig } from "@/lib/ai/config";
import { prisma } from "@/lib/prisma";
import { jobRetentionLabel } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-data";

export const loadImportModal = action(z.object({ job: z.string().optional() }), async ({ job }) => {
  const [aiReady, ai, settings] = await Promise.all([isAiConfigured(), loadAiConfig(), loadSettings()]);
  const reading = await prisma.job.findFirst({ where: { type: "import-profile", ...(job ? { id: job } : {}), OR: [{ status: { in: ["QUEUED", "RUNNING"] } }, { finishedAt: { gte: new Date(Date.now() - settings.jobRetentionHours * 3_600_000) } }, { finishedAt: null, updatedAt: { gte: new Date(Date.now() - settings.jobRetentionHours * 3_600_000) } }] }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
  return { aiReady, provider: ai.provider, keptFor: jobRetentionLabel(settings.jobRetentionHours), initialJobId: reading?.id ?? null, unavailable: Boolean(job && !reading) };
});
