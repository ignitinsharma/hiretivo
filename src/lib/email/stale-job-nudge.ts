import { sendEmail } from "@/lib/resend";

interface StaleJobNudgeData {
  recruiterEmail: string;
  recruiterName: string;
  jobTitle: string;
  daysInactive: number;
}

export async function sendStaleJobNudge({
  recruiterEmail,
  recruiterName,
  jobTitle,
  daysInactive,
}: StaleJobNudgeData) {
  return sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to: [recruiterEmail],
    subject: `Your job "${jobTitle}" hasn't had activity in ${daysInactive} days`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #5C54E6;">Hi ${recruiterName},</h2>
        <p>We noticed your job posting <strong>"${jobTitle}"</strong> hasn't had any activity in the last ${daysInactive} days.</p>
        <p>Here are a few things you can do to re-engage:</p>
        <ul>
          <li>Review and update the job description</li>
          <li>Check your applicant pipeline</li>
          <li>Consider adjusting the job requirements</li>
        </ul>
        <p style="margin-top: 24px;">
          <a href="https://hiretivo.com/recruiter/jobs" style="background: #5C54E6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Your Jobs
          </a>
        </p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
          This is an automated message from Hiretivo. If you no longer wish to receive these emails, you can update your notification preferences in settings.
        </p>
      </div>
    `,
    text: `Hi ${recruiterName},\n\nWe noticed your job posting "${jobTitle}" hasn't had any activity in the last ${daysInactive} days.\n\nLog in to Hiretivo to review and re-engage with your applicants.\n\nView your jobs: https://hiretivo.com/recruiter/jobs`,
  });
}
