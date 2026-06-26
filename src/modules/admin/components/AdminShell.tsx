"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/jobs/new", label: "New job" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/ats", label: "ATS" },
];

/*
 * AdminShell
 * Top-level chrome for admin pages. Renders a sticky branded header with a logo
 * mark and a pill-style nav that highlights the active route. Borders/tints only
 * (no shadow, no dark mode) per project styling rules.
 *
 * @param children - Page content rendered inside the main wrapper.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Overview + Jobs use exact match so they don't stay highlighted on sub-routes
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/jobs") return pathname === "/admin/jobs";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-10 border-b border-brand-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo size="md" />
            <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-primary">
              Admin
            </span>
          </Link>
          <nav className="flex flex-wrap gap-1.5">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(n.href)
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-brand-foreground-muted hover:bg-brand-surface hover:text-brand-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
