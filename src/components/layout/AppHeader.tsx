"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { AccountMenu } from "@/components/shared/AccountMenu";
import { cn } from "@/lib/utils";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import { seekerService } from "@/services/seeker.service";
import { Menu, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerationQuota } from "@/hooks/use-generation-quota";

const NAV_ITEMS = SEEKER_NAV_ITEMS.filter(
  (item) => item.href !== "/profile" && item.href !== "/settings",
);

export function AppHeader() {
  const pathname = usePathname();
  const hiretivo = useVerificationStatus();
  const { status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const { data: settingsData } = useQuery<{ data: { image?: string | null } }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 5 * 60 * 1000,
    enabled: status === "authenticated",
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
        <Link href="/dashboard" className="flex items-center shrink-0">
          <Logo size="sm" className="h-5 w-auto" />
        </Link>

        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-pill transition-all duration-150",
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <QuotaDisplay />
          <AccountMenu
            settingsHref="/settings"
            fallbackName="Job Seeker"
            fallbackEmail="Seeker account"
            fallbackSeed="app-header"
            verified={hiretivo.isVerified}
            ariaLabel="Open account menu"
            imageOverride={settingsData?.data?.image ?? null}
          />
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-pill text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-brand-border bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 text-sm font-medium px-4 py-2 rounded-pill transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

function QuotaDisplay() {
  const { data: quota, isLoading } = useGenerationQuota();

  if (isLoading) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-brand-border text-xs font-medium text-gray-700">
        <Skeleton className="h-4 w-8" />
        <span className="text-gray-500">left</span>
      </div>
    );
  }

  if (!quota || quota.plan === "SCALE") {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-brand-border text-xs font-medium text-gray-700">
        <span className="text-brand-primary font-semibold">Unlimited</span>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-brand-border text-xs font-medium text-gray-700">
      <span className="text-brand-primary font-semibold">
        {Math.max(0, quota.limit - quota.used)}
      </span>
      <span className="text-gray-500">left</span>
    </div>
  );
}
