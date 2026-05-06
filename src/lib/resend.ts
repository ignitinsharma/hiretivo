import { Resend } from "resend";

const globalForResend = globalThis as unknown as { resend: Resend | undefined };

function getResend(): Resend {
  if (globalForResend.resend) {
    return globalForResend.resend;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const client = new Resend(apiKey);

  if (process.env.NODE_ENV !== "production") {
    globalForResend.resend = client;
  }

  return client;
}

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, property, receiver) {
    return Reflect.get(getResend(), property, receiver);
  },
});

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
  const { data, error } = await getResend().emails.send({
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
