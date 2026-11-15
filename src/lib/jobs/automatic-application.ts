import "server-only";

import { z } from "zod";

import { Tone } from "@/generated/prisma/enums";
import { getAiProvider } from "@/lib/ai";
import { extractedOf, extractedSchema, type Extracted } from "@/lib/application-data";
import { loadTaskOptions } from "@/lib/ai/task-options";
import { extractPosting, tailorResume, writeCoverLetter } from "@/lib/ai/tasks";
import { fetchPosting } from "@/lib/posting-fetch";
import { prisma } from "@/lib/prisma";
import { loadProfile } from "@/lib/profile-data";
import { withoutSectionsOff } from "@/lib/resume-sections";
import { loadSettings } from "@/lib/settings-data";

import { AUTOMATIC_APPLICATION_STEPS } from "./application-steps";
import { defineJob, JobError } from "./runner";
import { saveAutomaticCoverLetter, saveAutomaticResumeDraft } from "./automatic-application-save";

export const AUTOMATIC_APPLICATION_KEY = "new-application";

/** One server-owned run from a pasted link or posting to a saved Draft. */
export const automaticApplicationJob = defineJob({
  type: "automatic-application",
  input: z.object({
    source: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("url"), url: z.url().max(2000) }),
      z.object({ kind: z.literal("text"), posting: z.string().trim().min(1).max(100_000), url: z.string().max(2000) }),
    ]),
    tone: z.enum(Tone),
    note: z.string().trim().max(2000),
    postingId: z.string().min(1).max(100).nullable(),
    startupId: z.string().min(1).max(100).nullable(),
    reading: z.object({ posting: z.string().min(1).max(100_000), postingUrl: z.string().max(2000), extracted: extractedSchema, extractedWith: z.string() }).optional(),
  }),
  result: z.object({ applicationId: z.string() }),
  async run({ source, tone, note, postingId, startupId, reading: savedReading }, { id, step, signal }) {
    const checkpoint = await prisma.job.findUnique({ where: { id }, select: { applicationId: true } });
    let applicationId = checkpoint?.applicationId ?? null;
    let posting: string;
    let extracted: Extracted;
    let postingUrl = source.url;
    let extractedWith = "";
    const existingApplication = applicationId
      ? await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { documents: { select: { kind: true } } } })
      : null;
    if (existingApplication?.documents.some((document) => document.kind === "COVER_LETTER")) return { applicationId: existingApplication.id };
    const [provider, options, fullProfile, settings] = await Promise.all([getAiProvider(), loadTaskOptions(), loadProfile(), loadSettings()]);
    const profile = withoutSectionsOff(fullProfile, settings.resumeSections);
    if (existingApplication) {
      // The resume is already saved. A retry only writes the missing letter.
      posting = existingApplication.postingText;
      extracted = extractedOf(existingApplication);
    } else if (savedReading) {
      posting = savedReading.posting;
      postingUrl = savedReading.postingUrl;
      extracted = savedReading.extracted;
      extractedWith = savedReading.extractedWith;
    } else {
      const fetched = source.kind === "url" ? await fetchPosting(source.url) : null;
      if (fetched && !fetched.ok) throw new JobError(fetched.error);
      posting = fetched?.ok ? fetched.text : source.kind === "text" ? source.posting : "";
      postingUrl = fetched?.ok ? fetched.url : source.url;
      if (posting.length > 100_000) throw new JobError("That posting is too long. Paste a shorter description instead.");
      await step(AUTOMATIC_APPLICATION_STEPS[0]);
      const reading = await extractPosting(provider, { posting }, { ...options, signal });
      extracted = reading.data;
      extractedWith = reading.promptVersion;
      // Retry can start at the resume even if a model fails after this point.
      await prisma.job.update({ where: { id }, data: { input: { source, tone, note, postingId, startupId, reading: { posting, postingUrl, extracted, extractedWith } } } });
    }

    if (!applicationId) {
      await step(AUTOMATIC_APPLICATION_STEPS[1]);
      const resume = await tailorResume(provider, {
        profile, extracted, match: null, posting,
        facts: note.trim() ? [note.trim()] : [],
        keepSkillOrder: settings.skillOrder === "manual",
      }, { ...options, signal });
      applicationId = await saveAutomaticResumeDraft({
        jobId: id, posting, postingUrl, extracted, extractedWith,
        resume: resume.data, resumeWith: resume.promptVersion, tone, note, postingId, startupId,
      });
    }

    await step(AUTOMATIC_APPLICATION_STEPS[2]);
    const letter = await writeCoverLetter(provider, { profile, extracted, match: null, tone, facts: note.trim() ? [note.trim()] : [], posting }, { ...options, signal });
    await saveAutomaticCoverLetter(applicationId, letter.data, letter.promptVersion, note);
    return { applicationId };
  },
});
