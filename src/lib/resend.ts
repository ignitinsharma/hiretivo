import { Resend } from "resend";

function createResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

const globalForResend = globalThis as unknown as { resend: Resend | undefined };

export const resend: Resend = globalForResend.resend ?? createResend();

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend;
}

export interface SendEmailInput {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  id: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { data, error } = await resend.emails.send({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email id");
  }

  return { id: data.id };
}
