import { FeedbackForm } from "./FeedbackForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leave Feedback — Hiretivo",
  robots: "noindex",
};

/*
 * FeedbackPage
 * Server component — no-auth feedback form page.
 * Validates token presence and passes it to the client-side FeedbackForm.
 * No app navigation chrome — standalone page for external links.
 */
export default function FeedbackPage({
  params,
}: {
  params: { token: string };
}) {
  return <FeedbackForm token={params.token} />;
}
