import type { SeekerSettingsData } from "@/services/seeker.service";
import type { ApplicationDefaultsInput } from "@/lib/validations/application-defaults.schema";
import type { SubmittedFormField } from "@/modules/seeker/apply/types/apply.types";

/*
 * buildSubmittedFormRows
 * Maps settings + application-defaults into the SubmittedFormField[] the
 * cheatsheet and finalize's submittedFormData expect. Shared by StepSubmit
 * (manual "I submitted") and the dashboard's Approve-all batch finalize
 * (Section D5) so both build the exact same field set.
 * @param settings - GET /seeker/settings response, or undefined while loading
 * @param defaults - GET /seeker/application-defaults response, or undefined/null while loading/unset
 */
export function buildSubmittedFormRows(
  settings: SeekerSettingsData | undefined,
  defaults: ApplicationDefaultsInput | null | undefined,
): SubmittedFormField[] {
  return [
    { fieldKey: "fullName", label: "Full name", value: settings?.name ?? "" },
    { fieldKey: "email", label: "Email", value: settings?.email ?? "" },
    { fieldKey: "phone", label: "Phone", value: defaults?.phone ?? "" },
    { fieldKey: "addressLine", label: "Address", value: defaults?.addressLine ?? "" },
    { fieldKey: "city", label: "City", value: defaults?.city ?? "" },
    { fieldKey: "state", label: "State", value: defaults?.state ?? "" },
    { fieldKey: "postalCode", label: "Postal code", value: defaults?.postalCode ?? "" },
    { fieldKey: "linkedinUrl", label: "LinkedIn", value: defaults?.linkedinUrl ?? "" },
    { fieldKey: "workAuth", label: "Work authorization", value: defaults?.workAuth ?? "" },
    { fieldKey: "needsSponsorship", label: "Needs sponsorship", value: defaults?.needsSponsorship ? "Yes" : "No" },
  ];
}
