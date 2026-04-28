import { ApplicationStatus } from "@/constants/enums";

export const APPLICATION_STAGE_ORDER: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

export function isValidStageTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_STAGE_ORDER.includes(from) && APPLICATION_STAGE_ORDER.includes(to);
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
