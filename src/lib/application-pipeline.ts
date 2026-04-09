import { ApplicationStatus } from "@/constants/enums";

export const APPLICATION_STAGE_ORDER: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

const TERMINAL_STAGES = new Set<ApplicationStatus>([
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
]);

export function isValidStageTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) {
    return true;
  }

  if (TERMINAL_STAGES.has(from)) {
    return false;
  }

  if (to === ApplicationStatus.REJECTED) {
    return true;
  }

  const fromIndex = APPLICATION_STAGE_ORDER.indexOf(from);
  const toIndex = APPLICATION_STAGE_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return toIndex === fromIndex + 1;
}

export function getStageLabel(status: ApplicationStatus): string {
  switch (status) {
    case ApplicationStatus.APPLIED:
      return "Applied";
    case ApplicationStatus.REVIEWING:
      return "Under Review";
    case ApplicationStatus.INTERVIEW:
      return "Interview";
    case ApplicationStatus.OFFER:
      return "Offer Received";
    case ApplicationStatus.HIRED:
      return "Hired";
    case ApplicationStatus.REJECTED:
      return "Not Selected";
    default:
      return status;
  }
}
