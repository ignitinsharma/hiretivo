import { ProfileSectionCard } from "@/modules/seeker/profile/components/ProfileSectionCard";
import { WorkAuthStatus, SelfIdGender, SelfIdAnswer } from "@/constants/enums";
import type { ApplicationDefaultsInput } from "@/lib/validations/application-defaults.schema";

interface ApplicationDefaultsSectionProps {
  defaults: ApplicationDefaultsInput | null;
}

const WORK_AUTH_LABELS: Record<WorkAuthStatus, string> = {
  [WorkAuthStatus.CITIZEN]: "Citizen",
  [WorkAuthStatus.PERMANENT_RESIDENT]: "Permanent resident",
  [WorkAuthStatus.WORK_VISA]: "Work visa",
  [WorkAuthStatus.NEEDS_SPONSORSHIP]: "Needs sponsorship",
  [WorkAuthStatus.STUDENT]: "Student",
  [WorkAuthStatus.OTHER]: "Other",
};

const GENDER_LABELS: Record<SelfIdGender, string> = {
  [SelfIdGender.MALE]: "Male",
  [SelfIdGender.FEMALE]: "Female",
  [SelfIdGender.NONBINARY]: "Non-binary",
  [SelfIdGender.PREFER_NOT]: "Prefer not to say",
};

const ANSWER_LABELS: Record<SelfIdAnswer, string> = {
  [SelfIdAnswer.YES]: "Yes",
  [SelfIdAnswer.NO]: "No",
  [SelfIdAnswer.PREFER_NOT]: "Prefer not to say",
};

function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : "Not set";
}

function isUsCountry(countryCode: string | null | undefined): boolean {
  return (countryCode ?? "").trim().toUpperCase() === "US";
}

/*
 * ApplicationDefaultsSection
 * Read-only card for the ATS-form-fill payload. Nudges the seeker to
 * complete it before their first apply when unset.
 */
export function ApplicationDefaultsSection({ defaults }: ApplicationDefaultsSectionProps) {
  const rows: Array<[string, string]> = [
    ["Phone", displayValue(defaults?.phone)],
    ["LinkedIn", displayValue(defaults?.linkedinUrl)],
    ["Address", displayValue(defaults?.addressLine)],
    ["City", displayValue(defaults?.city)],
    ["State / Region", displayValue(defaults?.state)],
    ["Postal Code", displayValue(defaults?.postalCode)],
    ["Country Code", displayValue(defaults?.countryCode)],
    ["Work Authorization", defaults?.workAuth ? WORK_AUTH_LABELS[defaults.workAuth] : "Not set"],
    ["Authorized Country", displayValue(defaults?.authorizedCountry)],
  ];

  if (isUsCountry(defaults?.countryCode)) {
    rows.push(
      ["Self-ID Gender", defaults?.selfIdGender ? GENDER_LABELS[defaults.selfIdGender] : "Not set"],
      ["Self-ID Ethnicity", displayValue(defaults?.selfIdEthnicity)],
      ["Veteran Status", defaults?.veteranStatus ? ANSWER_LABELS[defaults.veteranStatus] : "Not set"],
      ["Disability Status", defaults?.disabilityStatus ? ANSWER_LABELS[defaults.disabilityStatus] : "Not set"],
    );
  }

  return (
    <ProfileSectionCard
      title="Application Defaults"
      editHref="/settings#application-defaults"
      isEmpty={!defaults}
      emptyLabel="Complete before your first apply — used to pre-fill job applications."
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">{label}</dt>
            <dd className="text-sm text-brand-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </ProfileSectionCard>
  );
}
