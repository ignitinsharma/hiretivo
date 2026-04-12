import { sendEmail } from "@/lib/resend";

const FROM_EMAIL = "Hiretivo <noreply@hiretivo.com>";

function formatUtcDateTime(date: Date): string {
  return date.toUTCString().replace(" GMT", " UTC");
}

function formatDuration(startsAt: Date, endsAt: Date): string {
  const mins = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  return `${mins} min`;
}

// --- scheduled ---

interface SendInterviewScheduledEmailInput {
  recruiterEmail: string;
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  startsAt: Date;
  endsAt: Date;
  meetLink?: string | null;
}

export async function sendInterviewScheduledEmail(
  input: SendInterviewScheduledEmailInput,
): Promise<void> {
  const dateStr = formatUtcDateTime(input.startsAt);
  const duration = formatDuration(input.startsAt, input.endsAt);
  const meetSection = input.meetLink
    ? `<p><strong>Join meeting:</strong> <a href="${input.meetLink}">${input.meetLink}</a></p>`
    : `<p><em>No meeting link provided.</em></p>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Interview Scheduled</h2>
      <p>Hi ${input.seekerName},</p>
      <p>An interview has been scheduled for <strong>${input.jobTitle}</strong>.</p>
      <p><strong>Date &amp; Time:</strong> ${dateStr} (UTC)</p>
      <p><strong>Duration:</strong> ${duration}</p>
      ${meetSection}
      <p style="color:#666;font-size:12px;">All times are in UTC. Please convert to your local timezone.</p>
    </div>
  `;
  const text = `Interview scheduled for ${input.jobTitle}. Date: ${dateStr} UTC. Duration: ${duration}.${input.meetLink ? ` Join: ${input.meetLink}` : ""}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: [input.recruiterEmail, input.seekerEmail],
    subject: `Interview scheduled — ${input.jobTitle}`,
    html,
    text,
  });
}

// --- rescheduled ---

interface SendInterviewRescheduledEmailInput {
  recruiterEmail: string;
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  startsAt: Date;
  endsAt: Date;
  meetLink?: string | null;
}

export async function sendInterviewRescheduledEmail(
  input: SendInterviewRescheduledEmailInput,
): Promise<void> {
  const dateStr = formatUtcDateTime(input.startsAt);
  const duration = formatDuration(input.startsAt, input.endsAt);
  const meetSection = input.meetLink
    ? `<p><strong>Join meeting:</strong> <a href="${input.meetLink}">${input.meetLink}</a></p>`
    : `<p><em>No meeting link provided.</em></p>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Interview Rescheduled</h2>
      <p>Hi ${input.seekerName},</p>
      <p>Your interview for <strong>${input.jobTitle}</strong> has been rescheduled.</p>
      <p><strong>New Date &amp; Time:</strong> ${dateStr} (UTC)</p>
      <p><strong>Duration:</strong> ${duration}</p>
      ${meetSection}
      <p style="color:#666;font-size:12px;">All times are in UTC. Please convert to your local timezone.</p>
    </div>
  `;
  const text = `Interview rescheduled for ${input.jobTitle}. New date: ${dateStr} UTC. Duration: ${duration}.`;

  await sendEmail({
    from: FROM_EMAIL,
    to: [input.recruiterEmail, input.seekerEmail],
    subject: `Interview rescheduled — ${input.jobTitle}`,
    html,
    text,
  });
}

// --- cancelled ---

interface SendInterviewCancelledEmailInput {
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
}

export async function sendInterviewCancelledEmail(
  input: SendInterviewCancelledEmailInput,
): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Interview Cancelled</h2>
      <p>Hi ${input.seekerName},</p>
      <p>Unfortunately, your interview for <strong>${input.jobTitle}</strong> has been cancelled.</p>
      <p>Please contact the recruiter if you have questions.</p>
    </div>
  `;
  const text = `Your interview for ${input.jobTitle} has been cancelled.`;

  await sendEmail({
    from: FROM_EMAIL,
    to: input.seekerEmail,
    subject: `Interview cancelled — ${input.jobTitle}`,
    html,
    text,
  });
}
