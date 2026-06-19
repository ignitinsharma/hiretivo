import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { fetchRecruiterSettingsForPrefetch } from "@/lib/server/recruiter-data.server";
import { QueryClient, dehydrate, type DehydratedState } from "@tanstack/react-query";
import { RecruiterLayoutClient } from "./RecruiterLayoutClient";

/*
 * RecruiterLayout
 * Async server component wrapping all /recruiter/* routes.
 * Prefetches ["recruiter-settings"] and passes dehydrated state to the client
 * shell so child pages render with warm cache — no blank-flash on settings/dashboard.
 */
export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  try {
    const session = await auth();
    if (session?.user?.id && session.user.role === UserRole.RECRUITER) {
      await queryClient.prefetchQuery({
        queryKey: ["recruiter-settings"],
        queryFn: () => fetchRecruiterSettingsForPrefetch(session.user.id),
      });
    }
  } catch {
    // Prefetch failure is non-fatal — client useQuery handles it
  }

  const dehydratedState: DehydratedState = dehydrate(queryClient);

  return (
    <RecruiterLayoutClient dehydratedState={dehydratedState}>
      {children}
    </RecruiterLayoutClient>
  );
}
