import { Inbox } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/PlaceholderScreen";

/*
 * InboxPage
 * Recruiter/employer messages — not yet available.
 */
export default function InboxPage() {
  return (
    <PlaceholderScreen
      icon={Inbox}
      tag="coming soon"
      title="Inbox"
      description="Messages from employers will land here once the inbox ships."
    />
  );
}
