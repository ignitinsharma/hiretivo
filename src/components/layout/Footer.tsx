import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-white px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <p className="text-sm text-brand-foreground-muted">
            Land your next role faster. Paste any job link, get a tailored
            resume in seconds, and track every application.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className="text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
        <p className="text-xs text-brand-foreground-secondary">
          &copy; {year} Hiretivo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
