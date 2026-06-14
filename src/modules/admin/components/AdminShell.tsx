"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/jobs/new", label: "New job" },
  { href: "/admin/verification", label: "Verification" },
];

/*
 * AdminShell
 * Top-level chrome for admin pages. Renders a minimal nav with active-route highlighting.
 * @param children - Page content rendered inside the main wrapper
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
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/admin/jobs" className="font-bold text-lg text-brand-foreground">
            Hiretivo Admin
          </Link>
          <nav className="flex flex-wrap gap-3 sm:gap-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm font-medium ${
                  isActive(n.href)
                    ? "text-brand-primary"
                    : "text-brand-foreground-muted hover:text-brand-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
