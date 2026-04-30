"use client";

import React, { createContext, useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LifeBuoy, Plus, LogOut, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { RECRUITER_NAV_ITEMS } from "@/constants/nav";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

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
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Recruiter";
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "R";
  const avatarUrl = session?.user?.image
    ? session.user.image.startsWith('http')
      ? session.user.image
      : `/api/logo?key=${encodeURIComponent(session.user.image)}`
    : null;

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-17" : "w-65",
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "px-5 py-5 flex items-center gap-3",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? (
          <SidebarToggle />
        ) : (
          <>
            <Link
              href="/recruiter/dashboard"
              className="flex items-center gap-3 flex-1"
            >
              <Logo />
            </Link>
            <SidebarToggle />
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent opacity-50" />

      {/* User profile */}
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
            {/* <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                Recruiter
              </span>
            </div> */}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent opacity-50" />

      {/* Post New Job CTA */}
      <div className={cn("px-4 py-5", collapsed && "px-2 py-3")}>
        {collapsed ? (
          <Button
            variant="primary"
            onClick={() => {
              const { useUIStore } = require("@/store/use-ui-store");
              useUIStore.getState().openPostJobModal();
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
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
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center justify-between py-2.5 px-3 border-l-[3px] rounded-r-md text-sm transition-all",
                  isActive
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium",
                  collapsed && "justify-center px-0 border-l-0 rounded-md mx-1",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3",
                    collapsed && "gap-0",
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
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
                {collapsed && item.badge && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-primary text-[8px] font-semibold flex items-center justify-center rounded-full text-white border border-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-slate-200">
        <Link
          href="/contact"
          title={collapsed ? "Contact & Support" : undefined}
          className={cn(
            "flex items-center gap-3 py-4 px-6 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <LifeBuoy className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Contact & Support</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "w-full flex items-center gap-3 py-4 px-6 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
