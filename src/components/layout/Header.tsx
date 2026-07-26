import { cn } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

interface HeaderProps {
  className?: string;
  variant?: "dark" | "light";
}

export async function Header({ className, variant = "light" }: HeaderProps) {
  const session = await auth();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-brand-border bg-white px-4 py-3 md:px-6",
        className,
      )}
      data-purpose="main-navigation"
    >
      <div className="mx-auto flex h-12 items-center justify-between max-w-7xl">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center"
          data-purpose="logo"
        >
          <Logo size="md" />
        </Link>

        {!session ? (
          <>
            <nav
              className="hidden items-center gap-6 lg:flex"
              aria-label="Public navigation"
            >
              <Link
                href="/pricing"
                className="text-sm font-medium text-brand-foreground-muted hover:text-brand-foreground transition-colors"
              >
                Pricing
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/seeker/login"
                className="text-sm font-medium text-brand-foreground-muted hover:text-brand-foreground transition-colors"
              >
                Sign In
              </Link>
              <Button asChild variant="primary" size="sm">
                <Link href="/seeker/register">Get Hired faster</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
