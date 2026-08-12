import { Client } from "@upstash/qstash";
import { z } from "zod";

export interface GenerationJobMessage {
  applicationId: string;
  userId: string;
  runId: string;
  jdText: string;
  forceGenerate: boolean;
  baseResumeJson?: unknown;
}

const generationJobSchema = z.object({
  applicationId: z.string().min(1),
  userId: z.string().min(1),
  runId: z.string().uuid(),
  jdText: z.string(),
  forceGenerate: z.boolean(),
  baseResumeJson: z.unknown().optional(),
});

export function parseGenerationJob(value: unknown): GenerationJobMessage {
  return generationJobSchema.parse(value);
}

function getClient(): Client {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN is not configured");
  return new Client({ token });
}

function getWorkerUrl(): string {
  const url = process.env.QSTASH_WORKER_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/internal/generation-worker`;
  if (!url.startsWith("https://")) {
    throw new Error("QSTASH_WORKER_URL or NEXT_PUBLIC_APP_URL must be an HTTPS URL");
  }
  return url;
}

/* Publishes one idempotent resume-generation job to QStash. */
export async function publishGenerationJob(message: GenerationJobMessage): Promise<void> {
  await getClient().publishJSON({
    url: getWorkerUrl(),
    body: message,
    retries: 2,
    deduplicationId: `application-generation:${message.runId}`,
  });
}
