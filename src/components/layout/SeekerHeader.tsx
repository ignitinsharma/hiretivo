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

const NAV_ITEMS = SEEKER_NAV_ITEMS.filter(
  (item) => item.href !== "/seeker/settings",
);

export function SeekerHeader() {
  const pathname = usePathname();
  const hiretivo = useVerificationStatus();
  const { status } = useSession();

  const { data: settingsData } = useQuery<{ data: { image?: string | null } }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 5 * 60 * 1000,
    enabled: status === "authenticated",
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-brand-border px-6 py-3">
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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 font-bold text-sm transition-colors",
                  isActive
                    ? "text-primary border-b-2 border-primary pb-0.5"
                    : "text-brand-foreground-muted hover:text-primary pb-0.5 border-b-2 border-white",
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
