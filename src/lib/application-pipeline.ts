import { ApplicationStatus } from "@/constants/enums";

export const APPLICATION_STAGE_ORDER: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

/*
 * isValidStageTransition
 * Enforces forward-only transitions in the main pipeline.
 * REJECTED can be reached from any non-terminal stage.
 * HIRED and REJECTED are terminal — no transitions out.
 */
export function isValidStageTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  // Terminal states cannot transition out
  if (from === ApplicationStatus.HIRED || from === ApplicationStatus.REJECTED) {
    return false;
  }
  // REJECTED can be reached from any active stage
  if (to === ApplicationStatus.REJECTED) {
    return true;
  }
  // Main pipeline: forward-only
  const PIPELINE = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.REVIEWING,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.HIRED,
  ];
  const fromIdx = PIPELINE.indexOf(from);
  const toIdx = PIPELINE.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx > fromIdx;
}

export function getStageLabel(status: ApplicationStatus): string {
  switch (status) {
    case ApplicationStatus.APPLIED:    return "Applied";
    case ApplicationStatus.REVIEWING:  return "Under Review";
    case ApplicationStatus.INTERVIEW:  return "Interview";
    case ApplicationStatus.OFFER:      return "Offer Received";
    case ApplicationStatus.HIRED:      return "Hired";
    case ApplicationStatus.REJECTED:   return "Not Selected";
    default:                           return status;
  }
}
