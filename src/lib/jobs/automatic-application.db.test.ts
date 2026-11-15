import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { demoLetterUnits, demoResumeUnits } from "@/lib/demo-profile";
import { extractPosting, tailorResume, writeCoverLetter } from "@/lib/ai/tasks";
import { getAiProvider } from "@/lib/ai";
import { createTestClient, resetDatabase } from "@/test/db";

import { seedBuiltIns } from "../../../prisma/seed/built-ins";

import { automaticApplicationJob, AUTOMATIC_APPLICATION_KEY } from "./automatic-application";
import { fetchPosting } from "@/lib/posting-fetch";

const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
vi.mock("@/lib/profile-data", async () => {
  const { demoProfile } = await import("@/lib/demo-profile");
  return { loadProfile: async () => demoProfile() };
});
vi.mock("@/lib/page-limit", () => ({ fitResumeToPages: async () => ({ trimmed: [], fits: true }) }));
vi.mock("@/lib/posting-fetch", () => ({ fetchPosting: vi.fn() }));
vi.mock("@/lib/ai", () => ({ getAiProvider: vi.fn(async () => ({})) }));
vi.mock("@/lib/ai/tasks", () => ({ extractPosting: vi.fn(), tailorResume: vi.fn(), writeCoverLetter: vi.fn() }));

const prisma = () => db.client!;
const posting = "Ledgerly is hiring a Senior Product Designer with Figma experience.";
const extracted = {
  title: "Senior Product Designer · Ledgerly",
  company: "Ledgerly",
  role: "Senior Product Designer",
  location: "Amsterdam",
  mode: "Hybrid",
  salary: null,
  deadline: null,
  requirements: [{ text: "Figma experience", kind: "skill" as const, skill: "Figma", years: null, language: null }],
  asksForReferences: false,
  language: "English",
};
const input = {
  source: { kind: "text" as const, posting, url: "" },
  tone: "WARM" as const,
  note: "Highlight research.",
  postingId: null,
  startupId: null,
};

beforeEach(async () => {
  await resetDatabase(prisma());
  await seedBuiltIns(prisma());
  vi.mocked(fetchPosting).mockReset();
  vi.mocked(getAiProvider).mockClear();
  vi.mocked(extractPosting).mockReset().mockResolvedValue({ data: extracted, promptVersion: "extract-posting@2" });
  vi.mocked(tailorResume).mockReset().mockResolvedValue({ data: demoResumeUnits(), promptVersion: "tailor-resume@1" });
  vi.mocked(writeCoverLetter).mockReset().mockResolvedValue({ data: [...demoLetterUnits(), { id: "sign-off", label: "Sign-off", text: "Kind regards," }], promptVersion: "write-cover-letter@1" });
});
afterAll(() => prisma().$disconnect());

async function run(source: typeof input.source | { kind: "url"; url: string }) {
  const id = "automatic-job";
  await prisma().job.create({ data: { id, type: automaticApplicationJob.type, key: AUTOMATIC_APPLICATION_KEY, status: "RUNNING", input: { ...input, source } } });
  const steps: string[] = [];
  const context = { id, signal: new AbortController().signal, step: async (name: string) => void steps.push(name) };
  return { result: await automaticApplicationJob.run({ ...input, source }, context), context, steps };
}

describe("automatic application", () => {
  it("reads, matches, writes both documents, and saves one draft even on retry", async () => {
    const { result, context, steps } = await run(input.source);
    const application = await prisma().application.findUniqueOrThrow({ where: { id: result.applicationId }, include: { documents: true } });
    expect(steps).toEqual(["Preparing job details", "Tailoring your resume", "Writing your cover letter"]);
    expect(application).toMatchObject({ status: "DRAFT", company: "Ledgerly", postingText: posting, match: null });
    expect(application.documents).toHaveLength(2);
    expect(await prisma().job.findUniqueOrThrow({ where: { id: context.id } })).toMatchObject({ key: `application:${result.applicationId}`, applicationId: result.applicationId });
    expect(await automaticApplicationJob.run(input, context)).toEqual(result);
    expect(await prisma().application.count()).toBe(1);
    expect(extractPosting).toHaveBeenCalledOnce();
    expect(tailorResume).toHaveBeenCalledOnce();
    expect(writeCoverLetter).toHaveBeenCalledOnce();
  });

  it("fetches a link before reading and saves its final address", async () => {
    vi.mocked(fetchPosting).mockResolvedValue({ ok: true, text: posting, url: "https://jobs.ledgerly.example/final", source: "structured" });
    const { result } = await run({ kind: "url", url: "https://jobs.ledgerly.example/1" });
    expect(fetchPosting).toHaveBeenCalledWith("https://jobs.ledgerly.example/1");
    expect(extractPosting).toHaveBeenCalledWith(expect.anything(), { posting }, expect.anything());
    expect(await prisma().application.findUniqueOrThrow({ where: { id: result.applicationId } })).toMatchObject({ postingUrl: "https://jobs.ledgerly.example/final" });
  });

  it("explains a blocked link without calling a model", async () => {
    vi.mocked(fetchPosting).mockResolvedValue({ ok: false, error: "Paste the posting instead." });
    await expect(run({ kind: "url", url: "https://jobs.example/blocked" })).rejects.toMatchObject({ name: "JobError", message: "Paste the posting instead." });
    expect(extractPosting).not.toHaveBeenCalled();
  });

  it("keeps a finished resume and retries only a failed cover letter", async () => {
    vi.mocked(writeCoverLetter).mockRejectedValueOnce(new Error("provider problem"));
    await expect(run(input.source)).rejects.toThrow("provider problem");
    const application = await prisma().application.findFirstOrThrow({ include: { documents: true } });
    expect(application.documents.map((document) => document.kind)).toEqual(["RESUME"]);
    expect(await prisma().job.findUniqueOrThrow({ where: { id: "automatic-job" } })).toMatchObject({ applicationId: application.id });
    const retry = await automaticApplicationJob.run(input, { id: "automatic-job", signal: new AbortController().signal, step: async () => {} });
    expect(retry.applicationId).toBe(application.id);
    expect(extractPosting).toHaveBeenCalledOnce();
    expect(tailorResume).toHaveBeenCalledOnce();
    expect(writeCoverLetter).toHaveBeenCalledTimes(2);
    expect(await prisma().document.count({ where: { applicationId: application.id } })).toBe(2);
  });

  it("reuses extracted details when resume generation fails", async () => {
    vi.mocked(tailorResume).mockRejectedValueOnce(new Error("resume provider problem"));
    await expect(run(input.source)).rejects.toThrow("resume provider problem");
    expect(await prisma().application.count()).toBe(0);
    const saved = await prisma().job.findUniqueOrThrow({ where: { id: "automatic-job" } });
    const retryInput = automaticApplicationJob.input.parse(saved.input);
    expect(retryInput.reading).toMatchObject({ posting, extracted });
    const result = await automaticApplicationJob.run(retryInput, { id: saved.id, signal: new AbortController().signal, step: async () => {} });
    expect(result.applicationId).toBeTruthy();
    expect(extractPosting).toHaveBeenCalledOnce();
    expect(tailorResume).toHaveBeenCalledTimes(2);
  });
});
