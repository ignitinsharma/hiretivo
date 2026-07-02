import { LayoutDashboard } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/PlaceholderScreen";

/*
 * DashboardPage
 * Seeker home — match-ranked job feed lands here in Phase 2.
 */
export default function DashboardPage() {
  return (
    <PlaceholderScreen
      icon={LayoutDashboard}
      title="Your dashboard"
      description="Your match-ranked job feed and apply activity will appear here."
    />
  );
}
