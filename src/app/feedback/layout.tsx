/*
 * FeedbackLayout
 * Minimal layout for the no-auth feedback form page.
 * Renders only children without app chrome (nav, footer, modals).
 */
export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
