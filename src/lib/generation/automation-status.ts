import { prisma } from "@/lib/prisma";
import { AutomationStatus } from "@prisma/client";

export const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;
export const GENERATION_TIMEOUT_REASON = "Resume generation timed out — please retry";

interface AutomationStateFields {
  automationStatus: AutomationStatus | null;
  failureReason: string | null;
  automationRunId: string | null;
  generationStartedAt: Date | null;
}

/*
 * resolveAutomationStatus
 * Flips a stale GENERATING application to FAILED once generation exceeds the
 * timeout window, and returns the effective status + reason. Shared by the full
 * application GET and the lightweight status endpoint so a stuck run can't be
 * polled forever.
 */
export async function resolveAutomationStatus(
  application: AutomationStateFields,
  id: string,
  seekerId: string,
): Promise<{ automationStatus: AutomationStatus | null; failureReason: string | null }> {
  if (
    application.automationStatus === AutomationStatus.GENERATING &&
    application.generationStartedAt &&
    Date.now() - application.generationStartedAt.getTime() > GENERATION_TIMEOUT_MS
  ) {
    await prisma.application.updateMany({
      where: {
        id,
        seekerId,
        automationRunId: application.automationRunId,
        automationStatus: AutomationStatus.GENERATING,
      },
      data: {
        automationStatus: AutomationStatus.FAILED,
        failureReason: GENERATION_TIMEOUT_REASON,
      },
    });
    return {
      automationStatus: AutomationStatus.FAILED,
      failureReason: GENERATION_TIMEOUT_REASON,
    };
  }

  return {
    automationStatus: application.automationStatus,
    failureReason: application.failureReason,
  };
}
