import { Loader2 } from "lucide-react";
import { SessionExpiredCleaner } from "./SessionExpiredCleaner";

interface SessionExpiredPageProps {
  searchParams?: {
    role?: string;
  };
}

/*
 * SessionExpiredPage
 * Public landing for an invalidated session (DB user gone behind a live JWT).
 * Shows a brief signing-out state, then SessionExpiredCleaner clears the stale
 * cookie and redirects to the role-appropriate login. Lives under the public
 * /auth/* prefix so middleware passes it through — never re-entering a guarded
 * route, which is what breaks the JWT-vs-DB redirect loop.
 * @param searchParams.role - "recruiter" routes to recruiter login; else seeker
 */
export default function SessionExpiredPage({
  searchParams,
}: SessionExpiredPageProps) {
  const loginPath =
    searchParams?.role === "recruiter"
      ? "/recruiter/login"
      : "/seeker/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full mx-auto p-8 text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Session expired</h1>
        <p className="text-muted-foreground">
          Signing you out and redirecting to login…
        </p>
        <SessionExpiredCleaner loginPath={loginPath} />
      </div>
    </div>
  );
}
