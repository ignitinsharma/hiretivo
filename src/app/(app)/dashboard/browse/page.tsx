import { Search } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/PlaceholderScreen";

/*
 * BrowseJobsPage
 * Browse/search of ATS-sourced jobs — populated in Phase 2 (feed).
 */
export default function BrowseJobsPage() {
  return (
    <PlaceholderScreen
      icon={Search}
      title="Browse jobs"
      description="Search and filter remote roles hiring worldwide. Coming in the jobs feed."
    />
  );
}
