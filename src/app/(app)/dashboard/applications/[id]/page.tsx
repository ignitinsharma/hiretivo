import { WizardShell } from "@/modules/seeker/apply/components/WizardShell";

/*
 * ApplyWizardPage
 * Server shell for the apply wizard route. Auth/role gating happens in the
 * `(app)` layout — this page just hands the application id to the client
 * wizard, which fetches its own data via useApplication.
 */
export default async function ApplyWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WizardShell applicationId={id} />;
}
