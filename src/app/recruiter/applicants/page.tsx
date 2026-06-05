import { redirect } from "next/navigation";

/*
 * /recruiter/applicants
 * Backward-compatible alias for the applications explorer.
 */
export default function RecruiterApplicantsRedirectPage() {
  redirect("/recruiter/applications");
}
