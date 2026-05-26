import { Lock } from "lucide-react";

import { LogoLink } from "@/components/shared/Logo";

interface OnboardingShellProps {
  children: React.ReactNode;
}

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <LogoLink href="/" />
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Secure account setup</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">{children}</div>
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Hiretivo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
