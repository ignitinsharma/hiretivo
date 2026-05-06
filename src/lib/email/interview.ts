import { sendEmail } from "@/lib/resend";
import { formatInterviewTimezoneDisplay } from "@/lib/timezone";

const FROM_EMAIL = "Hiretivo <noreply@hiretivo.com>";

function formatDuration(startsAt: Date, endsAt: Date): string {
  const mins = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  return `${mins} min`;
}

function formatInterviewTimeBlock(
  startsAt: Date,
  endsAt: Date,
  scheduledTimeZone: string | null | undefined,
  viewerTimezone: string | null | undefined,
): {
  html: string;
  text: string;
} {
  const starts = formatInterviewTimezoneDisplay(
    startsAt,
    scheduledTimeZone,
    viewerTimezone,
  );
  const ends = formatInterviewTimezoneDisplay(
    endsAt,
    scheduledTimeZone,
    viewerTimezone,
  );

  return {
    html: `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;">
        <p><strong>Scheduled start:</strong> ${starts.scheduled}</p>
        <p><strong>Your start:</strong> ${starts.viewer}</p>
        <p><strong>Scheduled end:</strong> ${ends.scheduled}</p>
        <p><strong>Your end:</strong> ${ends.viewer}</p>
      </div>
    `,
    text: [
      `Scheduled start: ${starts.scheduled}`,
      `Your start: ${starts.viewer}`,
      `Scheduled end: ${ends.scheduled}`,
      `Your end: ${ends.viewer}`,
    ].join(" "),
  };
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
  scheduledTimeZone?: string | null;
  viewerTimezone?: string | null;
}

export async function sendInterviewScheduledEmail(
  input: SendInterviewScheduledEmailInput,
): Promise<void> {
  const timeBlock = formatInterviewTimeBlock(
    input.startsAt,
    input.endsAt,
    input.scheduledTimeZone,
    input.viewerTimezone,
  );
  const duration = formatDuration(input.startsAt, input.endsAt);
  const meetSection = input.meetLink
    ? `<p><strong>Join meeting:</strong> <a href="${input.meetLink}">${input.meetLink}</a></p>`
    : `<p><em>No meeting link provided.</em></p>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Interview Scheduled</h2>
      <p>Hi ${input.seekerName},</p>
      <p>An interview has been scheduled for <strong>${input.jobTitle}</strong>.</p>
      ${timeBlock.html}
      <p><strong>Duration:</strong> ${duration}</p>
      ${meetSection}
    </div>
  `;
  const text = `Interview scheduled for ${input.jobTitle}. ${timeBlock.text} Duration: ${duration}.${input.meetLink ? ` Join: ${input.meetLink}` : ""}`;

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
  scheduledTimeZone?: string | null;
  viewerTimezone?: string | null;
}

export async function sendInterviewRescheduledEmail(
  input: SendInterviewRescheduledEmailInput,
): Promise<void> {
  const timeBlock = formatInterviewTimeBlock(
    input.startsAt,
    input.endsAt,
    input.scheduledTimeZone,
    input.viewerTimezone,
  );
  const duration = formatDuration(input.startsAt, input.endsAt);
  const meetSection = input.meetLink
    ? `<p><strong>Join meeting:</strong> <a href="${input.meetLink}">${input.meetLink}</a></p>`
    : `<p><em>No meeting link provided.</em></p>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Interview Rescheduled</h2>
      <p>Hi ${input.seekerName},</p>
      <p>Your interview for <strong>${input.jobTitle}</strong> has been rescheduled.</p>
      ${timeBlock.html}
      <p><strong>Duration:</strong> ${duration}</p>
      ${meetSection}
    </div>
  `;
  const text = `Interview rescheduled for ${input.jobTitle}. ${timeBlock.text} Duration: ${duration}.`;

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
