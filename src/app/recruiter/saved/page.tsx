import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/constants/enums";
import { generatePageMetadata } from "@/lib/metadata";
import { SavedEngineersList } from "./SavedEngineersList";

export const metadata = generatePageMetadata({
  title: "Saved Engineers",
  description: "View your saved engineer profiles.",
});

/*
 * SavedEngineersPage
 * Server component that checks auth and renders the saved engineers list.
 */
export default async function SavedEngineersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== UserRole.RECRUITER) redirect("/seeker/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl text-brand-foreground">Saved Engineers</h1>
        <p className="text-brand-foreground-muted mt-1">Engineers you&apos;ve bookmarked for later</p>
      </div>

      <SavedEngineersList />
    </div>
  );
}
