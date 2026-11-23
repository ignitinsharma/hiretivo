import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { send } from "@vercel/queue";
import { z } from "zod";

import { deploymentMode } from "@/lib/deployment-mode";
import { env } from "@/lib/env";

const payload = z.object({
  owner: z.uuid(),
  id: z.string().regex(/^[a-z0-9]{20,32}$/),
  attempt: z.iso.datetime(),
});
export type QueuedJob = z.infer<typeof payload>;

export function usesVercelQueue() {
  return process.env.VERCEL === "1" && deploymentMode() === "hosted";
}

function signature({ owner, id, attempt }: QueuedJob) {
  return createHmac("sha256", env.HIRETIVO_SECRET)
    .update(JSON.stringify(["vercel-job-v1", owner, id, attempt]))
    .digest("hex");
}

export function readQueuedJob(message: unknown): QueuedJob {
  const parsed = payload.extend({ signature: z.string().regex(/^[a-f0-9]{64}$/) }).parse(message);
  if (!timingSafeEqual(Buffer.from(parsed.signature, "hex"), Buffer.from(signature(parsed), "hex"))) {
    throw new Error("Invalid queued job signature.");
  }
  return parsed;
}

export async function publishQueuedJob(job: QueuedJob) {
  await send("hiretivo-jobs", { ...job, signature: signature(job) }, {
    idempotencyKey: `${job.owner}:${job.id}:${job.attempt}`,
  });
}
