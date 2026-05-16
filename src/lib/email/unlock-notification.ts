import { sendEmail } from "@/lib/resend";

/*
 * sendUnlockNotificationEmail
 * Notifies an engineer when a recruiter unlocks their profile.
 * source='talent_pool': uses "viewed and unlocked contact details" copy.
 * source='application_auto': uses "viewed your application profile" copy.
 * Called fire-and-forget — do not await at call site.
 */
export async function sendUnlockNotificationEmail(params: {
  engineerEmail: string;
  engineerName: string;
  companyName: string;
  source: "talent_pool" | "application_auto";
}): Promise<void> {
  const { engineerEmail, engineerName, companyName, source } = params;
  const body =
    source === "talent_pool"
      ? `${companyName} viewed your profile and unlocked your contact details.`
      : `${companyName} viewed your application profile.`;

  await sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to: engineerEmail,
    subject: `${companyName} viewed your Hiretivo profile`,
    html: `<p>Hi ${engineerName},</p><p>${body}</p><p><a href="https://hiretivo.com/seeker/settings">View in settings →</a></p>`,
    text: `Hi ${engineerName},\n\n${body}\n\nView in settings: https://hiretivo.com/seeker/settings`,
  });
}
