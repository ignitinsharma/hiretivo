import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showRecruiterToggle?: boolean;
  recruiterMode?: boolean;
  onToggleMode?: () => void;
  toggleLinkText?: string;
  toggleLinkHref?: string;
  leftContent?: React.ReactNode;
  role?: "seeker" | "recruiter";
  backHref?: string;
}

/**
 * Provides the shared two-column shell used by seeker and recruiter auth pages.
 */
export function AuthLayout({
  children,
  title,
  description,
  leftContent,
  role,
  backHref,
}: AuthLayoutProps) {
  const roleBadge = role === "seeker"
    ? { label: "Seeker", color: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" }
    : role === "recruiter"
    ? { label: "Recruiter", color: "bg-gray-100 text-gray-700 border-brand-border" }
    : null;

  return (
    <main className="min-h-dvh flex flex-col md:flex-row bg-white selection:bg-brand-primary/20 antialiased overflow-x-hidden">
      {/* Left Side: Visual Storytelling */}
      <section className="hidden md:flex md:w-1/2 bg-[#f8f8fd] relative flex-col justify-center items-center px-8 lg:px-12 overflow-hidden">
        {leftContent}
      </section>

      {/* Right Side: Auth Form */}
      <section className={cn(
        "w-full flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-8",
        leftContent ? "md:w-1/2" : "md:w-full items-center"
      )}>
        <div className="w-full max-w-md mx-auto">
          {/* Mobile-only header info / branding */}
          <div className="md:hidden mb-8">
            <Link href="/" className="inline-flex items-center">
              <Logo size="md" />
            </Link>
          </div>

          <header className="mb-6 text-center md:text-left">
            {/* Back button and role badge row */}
            <div className="flex items-center justify-between mb-6">
              {backHref ? (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-foreground-muted hover:text-brand-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              ) : (
                <div />
              )}
              {roleBadge && (
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  roleBadge.color
                )}>
                  {roleBadge.label}
                </span>
              )}
            </div>

            <h2 className="font-bold text-3xl text-brand-foreground tracking-tight mb-2">
              {title}
            </h2>
            {description && (
              <p className="text-brand-foreground-muted font-medium">{description}</p>
            )}
          </header>

          <div className="space-y-6">{children}</div>

          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <Link
              href="/privacy"
              className="text-[11px] font-semibold text-brand-foreground-secondary uppercase tracking-wider hover:text-brand-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[11px] font-semibold text-brand-foreground-secondary uppercase tracking-wider hover:text-brand-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/help"
              className="text-[11px] font-semibold text-brand-foreground-secondary uppercase tracking-wider hover:text-brand-foreground transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
