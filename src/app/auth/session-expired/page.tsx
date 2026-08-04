import { Loader2 } from "lucide-react";
import { SessionExpiredCleaner } from "./SessionExpiredCleaner";

interface SessionExpiredPageProps {
  searchParams?: {
    role?: string;
  };
}

export default function SessionExpiredPage({
  searchParams,
}: SessionExpiredPageProps) {
  const loginPath = "/seeker/login";

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
