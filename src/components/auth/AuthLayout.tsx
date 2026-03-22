import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showRecruiterToggle?: boolean;
  recruiterMode?: boolean;
  onToggleMode?: () => void;
  toggleLinkText?: string;
  toggleLinkHref?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  showRecruiterToggle = false,
  recruiterMode = false,
  toggleLinkText,
  toggleLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-background to-brand-primary/10 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <LogoIcon className="h-8 w-8" />
              <span className="text-2xl font-bold text-brand-dark">
                Hiretivo
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-medium text-brand-primary bg-brand-primary-light/50 rounded-full px-3 py-1.5 w-fit mx-auto mb-4">
              <UserRoleIcon />
              <span>{recruiterMode ? "Recruiter" : "Job Seeker"}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">{children}</div>

          {toggleLinkText && toggleLinkHref && (
            <p className="text-center text-sm text-muted-foreground">
              {toggleLinkText}{" "}
              <Link
                href={toggleLinkHref}
                className="font-medium text-brand-primary hover:underline"
              >
                {recruiterMode ? "Sign in" : "Sign up"}
              </Link>
            </p>
          )}
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} Hiretivo Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#5c54e6" />
      <path
        d="M8 22L12 10L16 18L20 10L24 22"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" fill="white" />
      <circle cx="20" cy="10" r="2" fill="white" />
    </svg>
  );
}

function UserRoleIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3a1 1 0 0 1-1-1 4 4 0 0 1 4-4h4Zm1-1a4 4 0 0 1 0 1h-1v1a1 1 0 1 1-2 0v-1H8a1 1 0 1 1 0-2h2a2 2 0 0 1 2 2v1h1a1 1 0 1 1 0 2h-1v1Z" />
    </svg>
  );
}
