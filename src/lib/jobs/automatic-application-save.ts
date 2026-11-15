import "server-only";

import type { Tone } from "@/generated/prisma/enums";
import { ActionError } from "@/lib/action";
import { summaryText, tailoringSummary } from "@/lib/ai/tailoring-summary";
import { calendarDay } from "@/lib/application-documents";
import { extractedOf, unitsSchema, type Extracted, type Unit } from "@/lib/application-data";
import { documentLabels } from "@/lib/document-labels";
import { documentLanguage } from "@/lib/document-language";
import { newFrame, withFrame } from "@/lib/letter-frame";
import { logServerError } from "@/lib/log";
import { fitResumeToPages } from "@/lib/page-limit";
import { prisma } from "@/lib/prisma";
import { loadProfile } from "@/lib/profile-data";
import { maxPages } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-data";

type ResumeDraftInput = {
  jobId: string;
  posting: string;
  postingUrl: string;
  extracted: Extracted;
  extractedWith: string;
  resume: Unit[];
  resumeWith: string;
  tone: Tone;
  note: string;
  postingId: string | null;
  startupId: string | null;
};

/** Saves the first finished document once; the linked job is the retry checkpoint. */
export async function saveAutomaticResumeDraft(input: ResumeDraftInput): Promise<string> {
  const settings = await loadSettings();
  const language = settings.docLanguage ?? input.extracted.language ?? "English";
  const applicationId = await prisma.$transaction(async (tx) => {
    const claimed = await tx.job.updateMany({ where: { id: input.jobId, key: "new-application" }, data: { key: "application:pending" } });
    if (claimed.count === 0) {
      const existing = await tx.job.findUnique({ where: { id: input.jobId }, select: { applicationId: true } });
      if (existing?.applicationId) return existing.applicationId;
      throw new ActionError("This application is already being created.");
    }
    const application = await tx.application.create({
      data: {
        title: input.extracted.title || [input.extracted.role, input.extracted.company].filter(Boolean).join(" · ") || "Untitled application",
        company: input.extracted.company ?? "",
        role: input.extracted.role ?? "",
        location: input.extracted.location ?? "",
        mode: input.extracted.mode ?? "",
        salary: input.extracted.salary ?? "",
        deadline: input.extracted.deadline ? new Date(`${input.extracted.deadline}T00:00:00Z`) : null,
        postingUrl: input.postingUrl,
        postingText: input.posting,
        extracted: input.extracted,
        extractedWith: input.extractedWith,
        tone: input.tone,
        language,
        ...(input.note.trim() ? { facts: { create: { text: input.note.trim() } } } : {}),
        documents: { create: [{
          kind: "RESUME",
          units: input.resume,
          themeId: settings.baseThemeId,
          writtenWith: input.resumeWith,
          versions: { create: { units: input.resume, cause: "WRITTEN" } },
        }] },
      },
      select: { id: true },
    });
    await tx.job.update({ where: { id: input.jobId }, data: { key: `application:${application.id}`, applicationId: application.id } });
    if (input.postingId) await tx.posting.updateMany({ where: { id: input.postingId, applicationId: null }, data: { applicationId: application.id } });
    if (input.startupId) await tx.startup.updateMany({ where: { id: input.startupId, applicationId: null }, data: { applicationId: application.id } });
    return application.id;
  });
  const limit = maxPages(settings.pageLimit);
  if (limit) {
    try { await fitResumeToPages(applicationId, await loadProfile(), limit); }
    catch (error) { logServerError("one-page trimming", error); }
  }
  return applicationId;
}

/** Adds only the missing letter; a retry never overwrites a document the user edited. */
export async function saveAutomaticCoverLetter(applicationId: string, letter: Unit[], letterWith: string, note: string): Promise<void> {
  const [application, profile, settings] = await Promise.all([
    prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { documents: true } }),
    loadProfile(),
    loadSettings(),
  ]);
  if (application.documents.some((document) => document.kind === "COVER_LETTER")) return;
  const framed = withFrame(letter, newFrame({
    basics: profile.basics,
    company: application.company,
    location: application.location,
    date: calendarDay(),
    dateFormat: settings.dateFormat,
    lang: documentLanguage(application.language, letter.map((unit) => unit.text).join(" ")).lang,
    labels: documentLabels(application.language),
  }));
  const resume = unitsSchema.parse(application.documents.find((document) => document.kind === "RESUME")?.units);
  const extracted = extractedOf(application);
  const message = summaryText(tailoringSummary({
    profile,
    company: application.company,
    role: application.role,
    match: { items: [] },
    resume,
    letter,
    tone: application.tone,
    note,
    references: !settings.includeRefs ? "setting-off" : extracted.asksForReferences ? "included" : "not-asked",
    strict: settings.strict,
    showChanges: settings.showDiff,
  }));
  await prisma.$transaction(async (tx) => {
    const existing = await tx.document.findUnique({ where: { applicationId_kind: { applicationId, kind: "COVER_LETTER" } }, select: { id: true } });
    if (existing) return;
    await tx.document.create({ data: {
      applicationId,
      kind: "COVER_LETTER",
      units: framed,
      themeId: settings.baseThemeId,
      writtenWith: letterWith,
      versions: { create: { units: framed, cause: "WRITTEN" } },
    } });
    await tx.chatMessage.create({ data: { applicationId, role: "AI", text: message } });
  });
}
