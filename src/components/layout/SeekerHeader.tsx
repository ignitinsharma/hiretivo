"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Send,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { AccountMenu } from "@/components/shared/AccountMenu";
import { cn } from "@/lib/utils";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import { seekerService } from "@/services/seeker.service";

/** Nav items to show — only Jobs and Applied Jobs per D-18. */
const NAV_ITEMS = SEEKER_NAV_ITEMS.filter(
  (item) => item.href !== "/seeker/settings" && item.href !== "/contact",
);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  'layout-dashboard': LayoutDashboard,
  send: Send,
};

export function SeekerHeader() {
  const pathname = usePathname();
  const hiretivo = useVerificationStatus();
  const { status } = useSession();

  /* Read from the same prefetched cache as the settings page — no extra network request. */
  const { data: settingsData } = useQuery<{ data: { image?: string | null } }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
    enabled: status === "authenticated",
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/seeker/dashboard" className="flex items-center">
          <Logo />
        </Link>

        <nav
          className="hidden md:flex flex-1 justify-center gap-8"
          aria-label="Seeker navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = ICON_MAP[item.iconName] ?? Briefcase;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 font-bold text-sm transition-colors",
                  isActive
                    ? "text-primary border-b-2 border-primary pb-0.5"
                    : "text-slate-600 hover:text-primary pb-0.5 border-b-2 border-white",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <AccountMenu
            settingsHref="/seeker/settings"
            fallbackName="Job Seeker"
            fallbackEmail="Seeker account"
            fallbackSeed="seeker-header"
            verified={hiretivo.isVerified}
            ariaLabel="Open seeker account menu"
            imageOverride={settingsData?.data?.image ?? null}
          />
        </div>
      </div>
    </header>
  );
}
