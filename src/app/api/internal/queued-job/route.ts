import { handleCallback } from "@vercel/queue";

import { executeQueuedJob } from "@/lib/jobs/runner";
import { readQueuedJob, usesVercelQueue } from "@/lib/jobs/vercel-queue";

export const maxDuration = 300;

const consume = handleCallback(async (message) => {
  await executeQueuedJob(readQueuedJob(message));
}, { visibilityTimeoutSeconds: 330 });

export async function POST(request: Request) {
  if (!usesVercelQueue()) return new Response(null, { status: 404 });
  return consume(request);
}
