"use client";

import React, { createContext, useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, Plus, LogOut, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { RECRUITER_NAV_ITEMS } from "@/constants/nav";
import { signOut } from "next-auth/react";
import { PlanTier } from "@/constants/enums";
import { Button } from "../ui/button";
import { billingService } from "@/services/billing.service";
import { recruiterService } from "@/services/recruiter.service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

export function useSidebarState() {
  return useContext(SidebarContext);
}

export function SidebarToggle({ className }: { className?: string }) {
  const { toggle } = useSidebarState();
  return (
    <button
      onClick={toggle}
      className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors",
        className,
      )}
      title="Toggle Sidebar"
    >
      <PanelLeft className="w-5 h-5" />
    </button>
  );
}

export function RecruiterSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const toggle = () => setCollapsed((c) => !c);
  const hideChrome = false;

  if (hideChrome) {
    return (
      <SidebarContext.Provider value={{ collapsed, toggle }}>
        <main className="min-h-screen w-full overflow-x-hidden">
          {children}
        </main>
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div className="flex min-h-screen">
        <RecruiterSidebarInner collapsed={collapsed} toggle={toggle} />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}

function RecruiterSidebarInner({
  collapsed,
  toggle,
}: {
  collapsed: boolean;
  toggle: () => void;
}) {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();

  // Read plan from subscription-status (DB-backed) so the badge stays accurate
  // after in-app plan changes without requiring a logout/login cycle.
  const { data: subscriptionStatus, isLoading: planLoading } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: billingService.getSubscriptionStatus,
    staleTime: 60_000,
    enabled: !!session?.user,
  });

  // Share cache with RecruiterSettingsClient — same key avoids redundant network call.
  const { data: settingsData } = useQuery({
    queryKey: ["recruiter-settings"],
    queryFn: recruiterService.getSettings,
    staleTime: 60_000,
    enabled: !!session?.user,
  });

  const companyLogo = settingsData?.data?.logo ?? null;

  /*
   * currentPlan derivation — three phases must all resolve before showing a label:
   * 1. sessionStatus === 'loading'  → session not yet hydrated, query is disabled (planLoading=false) → show skeleton
   * 2. session loaded, planLoading  → query in-flight → show skeleton
   * 3. both settled                 → prefer DB plan, fall back to JWT, then FREE
   * Without tracking sessionStatus, phase 1 falls through to FREE because the query
   * is disabled (planLoading=false) when session hasn't resolved yet — causing the
   * Free → Starter → Scale flicker on every reload.
   */
  const currentPlan: PlanTier | null =
    sessionStatus === "loading" || planLoading
      ? null
      : (subscriptionStatus?.plan as PlanTier | undefined)
          ?? (session?.user?.plan as PlanTier | undefined)
          ?? PlanTier.FREE;
  const planLabel =
    currentPlan === PlanTier.SCALE ? "Scale"
    : currentPlan === PlanTier.GROWTH ? "Growth"
    : currentPlan === PlanTier.STARTER ? "Starter"
    : "Free";
  const isPaidPlan =
    currentPlan === PlanTier.STARTER || currentPlan === PlanTier.GROWTH || currentPlan === PlanTier.SCALE;

  const userName = session?.user?.name ?? "Recruiter";
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "R";

  const avatarUrl =
    companyLogo ??
    (session?.user?.image
      ? session.user.image.startsWith("http")
        ? session.user.image
        : `/api/logo?key=${encodeURIComponent(session.user.image)}`
      : null);
  const sidebarTooltipClasses =
    "rounded-lg border border-brand-border bg-white text-[#0a0a0a] shadow-none font-medium";

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-17" : "w-65",
        )}
      >
        {/* Logo + Toggle */}
        <div
          className={cn(
            "px-5 py-5 flex items-start gap-3",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <SidebarToggle />
          ) : (
            <>
              <Link
                href="/recruiter/dashboard"
                className="flex min-w-0 flex-1 flex-col items-start gap-2"
              >
                <Logo />
                {currentPlan === null ? (
                  <span className="h-4 w-14 animate-pulse rounded-md bg-brand-surface" aria-hidden />
                ) : (
                  <span
                    className={cn(
                      "inline-flex max-w-full items-center rounded-lg border px-2 py-px text-[10px] font-semibold uppercase tracking-wide",
                      isPaidPlan
                        ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary/90"
                        : "border-brand-border bg-brand-surface text-brand-foreground-muted",
                    )}
                  >
                    {planLabel}
                  </span>
                )}
              </Link>
              <SidebarToggle className="shrink-0" />
            </>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent opacity-50" />

        {/* User profile
      <div
        className={cn(
          "px-5 py-4 flex items-center gap-3",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-black font-semibold text-sm ring-2 ring-gray-100">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={initials} width={40} height={40} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-base text-slate-900 truncate">
              {userName}
            </span>
          
          </div>
        )}
      </div> */}

        {/* Divider */}
        <div className="mx-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent opacity-50" />

        {/* Post New Job CTA */}
        <div className={cn("px-4 py-5", collapsed && "px-2 py-3")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  className="transition-transform duration-200 hover:scale-105"
                  onClick={() => {
                    const { useUIStore } = require("@/store/use-ui-store");
                    useUIStore.getState().openPostJobModal();
                  }}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className={sidebarTooltipClasses}>
                Post New Job
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="primary"
              className="w-full py-3 px-4"
              onClick={() => {
                const { useUIStore } = require("@/store/use-ui-store");
                useUIStore.getState().openPostJobModal();
              }}
            >
              <Plus className="w-5 h-5 shrink-0" />
              Post New Job
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {RECRUITER_NAV_ITEMS.map((item, index) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            const showSeparator = index === 4;

            return (
              <React.Fragment key={item.href}>
                {showSeparator && (
                  <div className="mx-3 my-2 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent opacity-30" />
                )}
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center justify-between py-2.5 px-3 border-l-[3px] rounded-r-md text-sm transition-all justify-center px-0 border-l-0 rounded-md mx-1 hover:bg-brand-primary/10 hover:text-brand-primary",
                          isActive
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
                            : "border-transparent text-slate-500 font-medium",
                        )}
                      >
                        <div className="flex items-center gap-0">
                          <item.icon className="w-5 h-5 shrink-0" />
                        </div>
                        {item.badge && (
                          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-primary text-[8px] font-semibold flex items-center justify-center rounded-full text-white border border-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className={sidebarTooltipClasses}
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center justify-between py-2.5 px-3 border-l-[3px] rounded-r-md text-sm transition-all",
                      isActive
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
                        : "border-transparent text-slate-500 hover:bg-brand-surface hover:text-brand-foreground font-medium",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold rounded px-1.5 py-0.5",
                          item.badgeVariant === "primary"
                            ? "bg-brand-primary text-white"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-slate-200">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 py-4 px-0 justify-center text-slate-600 font-semibold text-sm hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                >
                  <LifeBuoy className="w-5 h-5 shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className={sidebarTooltipClasses}>
                Contact & Support
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/contact"
              className="flex items-center gap-3 py-4 px-6 text-slate-600 font-semibold text-sm hover:bg-brand-surface hover:text-brand-foreground transition-colors"
            >
              <LifeBuoy className="w-5 h-5 shrink-0" />
              <span>Contact & Support</span>
            </Link>
          )}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 py-4 px-0 justify-center text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className={sidebarTooltipClasses}>
                Sign Out
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 py-4 px-6 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
