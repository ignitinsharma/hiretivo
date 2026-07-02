import { UserCircle } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/PlaceholderScreen";

/*
 * ProfilePage
 * Seeker profile (resume, skills, ATS-form fields) — built in Phase 3c.
 */
export default function ProfilePage() {
  return (
    <PlaceholderScreen
      icon={UserCircle}
      title="Your profile"
      description="Your resume, skills, and application details will live here."
    />
  );
}
