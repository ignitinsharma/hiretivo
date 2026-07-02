import { Settings } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/PlaceholderScreen";

/*
 * SettingsPage
 * Account + preferences settings — wired up in later phases.
 */
export default function SettingsPage() {
  return (
    <PlaceholderScreen
      icon={Settings}
      title="Settings"
      description="Manage your account, notifications, and preferences here."
    />
  );
}
