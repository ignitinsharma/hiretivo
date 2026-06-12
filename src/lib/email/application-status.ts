import { getStageLabel } from "@/lib/application-pipeline";
import { sendEmail } from "@/lib/resend";
import { ApplicationStatus } from "@/constants/enums";
import { escapeHtml } from "@/lib/email/escape-html";

const FROM_EMAIL = "Hiretivo <noreply@hiretivo.com>";

interface SendApplicationStatusEmailInput {
  toEmail: string;
  candidateName: string;
  jobTitle: string;
  stage: ApplicationStatus;
}

export async function sendApplicationStatusEmail(
  input: SendApplicationStatusEmailInput,
): Promise<void> {
  const stageLabel = getStageLabel(input.stage);
  const subject = `Your application status is now: ${stageLabel}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: input.toEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Update</h2>
        <p>Hi ${escapeHtml(input.candidateName)},</p>
        <p>Your application for <strong>${escapeHtml(input.jobTitle)}</strong> has moved to <strong>${stageLabel}</strong>.</p>
        <p>We will notify you again if there are further updates.</p>
      </div>
    `,
    text: `Hi ${input.candidateName}, your application for ${input.jobTitle} is now ${stageLabel}.`,
  });
}
