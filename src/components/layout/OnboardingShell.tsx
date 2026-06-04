import { Lock } from "lucide-react";

import { LogoLink } from "@/components/shared/Logo";

/*
 * OnboardingShell
 * Two-column layout shell for onboarding flows.
 * Renders a sticky header, footer, and a main area with an optional side rail.
 * On mobile: single column (side rail stacks below main content).
 * On desktop (lg+): two-column layout with side rail pinned to the right.
 */
interface OnboardingShellProps {
  children: React.ReactNode;
  /** Optional side rail content rendered to the right on desktop, below on mobile */
  sideRail?: React.ReactNode;
}

export function OnboardingShell({ children, sideRail }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white border-b border-brand-border px-6 py-3">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <LogoLink href="/" />
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-brand-border text-sm text-brand-foreground-muted">
            <Lock className="w-4 h-4" />
            <span>Secure account setup</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">{children}</div>
            {sideRail && (
              <aside className="w-full lg:w-80 shrink-0">{sideRail}</aside>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-brand-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-brand-foreground-muted">
          © {new Date().getFullYear()} Hiretivo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
