import { AutomationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { publishGenerationJob } from "@/lib/generation/qstash";
import { runApplicationGeneration } from "@/lib/generation/run-application-generation";
import type { GenerationJobMessage } from "@/lib/generation/qstash";

export const GENERATION_WORKER_PATH = "/api/internal/generation-worker";

export interface GenerationDispatchResult {
  queued: boolean;
}

/*
 * dispatchGenerationJob
 * Routes resume generation through the right transport for the environment:
 * - production enqueues to QStash (signed delivery, retries) with the worker
 *   URL derived from the request origin so the job always lands on the same
 *   deployment that enqueued it;
 * - non-production runs the exact same worker function inline. QStash can
 *   never reach a localhost dev server, so queueing there fails
 *   deterministically — inline keeps dev/test on the identical code path the
 *   worker executes in production.
 * The test suite pins both branches so the dev path cannot silently regress.
 */
export async function dispatchGenerationJob(
  message: GenerationJobMessage,
  requestUrl: string,
): Promise<GenerationDispatchResult> {
  if (process.env.NODE_ENV === "production") {
    const workerUrl = new URL(GENERATION_WORKER_PATH, requestUrl).toString();
    await publishGenerationJob(message, workerUrl);
    return { queued: true };
  }

  try {
    await runApplicationGeneration(message);
  } catch (error) {
    await prisma.application.updateMany({
      where: { id: message.applicationId, automationRunId: message.runId },
      data: {
        automationStatus: AutomationStatus.FAILED,
        failureReason: "Generation failed — check the server logs",
      },
    });
    throw error;
  }
  return { queued: false };
}