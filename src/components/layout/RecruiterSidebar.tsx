'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { Plus, LogOut, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RECRUITER_NAV_ITEMS } from '@/constants/nav';
import { useFetchRecruiterDashboard } from '@/modules/recruiter/dashboard/hooks/use-fetch-recruiter-dashboard';

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
        'h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors',
        className
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
  const toggle = () => setCollapsed((c) => !c);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div className="flex min-h-screen">
        <RecruiterSidebarInner collapsed={collapsed} toggle={toggle} />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}

const NAV_BADGE_MAP: Record<string, 'activeJobsCount' | 'totalApplications'> = {
  '/recruiter/jobs': 'activeJobsCount',
  '/recruiter/applications': 'totalApplications',
};

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free Plan',
  PRO: 'Pro Plan',
  ENTERPRISE: 'Enterprise Plan',
};

function RecruiterSidebarInner({
  collapsed,
  toggle,
}: {
  collapsed: boolean;
  toggle: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: dashboardData, isLoading: isDashboardLoading } = useFetchRecruiterDashboard();

  const userName = session?.user?.name ?? 'Recruiter';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const planLabel = PLAN_LABELS[session?.user?.plan ?? ''] ?? 'Free Plan';

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn('px-5 py-5 flex items-center gap-3', collapsed && 'justify-center px-0')}>
        <Link href="/recruiter/dashboard" className="flex items-center gap-3">
          {collapsed ? (
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
              H
            </div>
          ) : (
            <Image src="/images/logo.png" alt="Hiretivo" width={130} height={36} className="h-9 w-auto object-contain" priority />
          )}
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />

      {/* User profile */}
      <div
        className={cn(
          'px-5 py-4 flex items-center gap-3',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-primary/10">
            {userInitials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm text-slate-900 truncate">
              {userName}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                {planLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />

      {/* Post New Job CTA */}
      <div className={cn('px-4 py-5', collapsed && 'px-2 py-3')}>
        {collapsed ? (
          <button
            className="mx-auto w-11 h-11 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            onClick={() => {
              const { useUIStore } = require('@/store/use-ui-store');
              useUIStore.getState().openPostJobModal();
            }}
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
          <button
            className="w-full py-3 px-4 bg-primary text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
            onClick={() => {
              const { useUIStore } = require('@/store/use-ui-store');
              useUIStore.getState().openPostJobModal();
            }}
          >
            <Plus className="w-5 h-5 shrink-0" />
            Post New Job
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {RECRUITER_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badgeKey = NAV_BADGE_MAP[item.href];
          const badgeValue = badgeKey && dashboardData?.stats[badgeKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center justify-between py-2.5 px-3 border-l-[3px] rounded-r-md text-sm transition-all',
                isActive
                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium',
                collapsed && 'justify-center px-0 border-l-0 rounded-md mx-1'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-3',
                  collapsed && 'gap-0'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && badgeKey && (
                isDashboardLoading ? (
                  <Skeleton className="h-4 w-6 rounded" />
                ) : (
                  <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-primary text-white">
                    {badgeValue ?? 0}
                  </span>
                )
              )}
              {collapsed && badgeKey && (
                isDashboardLoading ? (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4">
                    <Skeleton className="w-4 h-4 rounded-full" />
                  </span>
                ) : (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-[8px] font-bold flex items-center justify-center rounded-full text-white border border-white">
                    {badgeValue ?? 0}
                  </span>
                )
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-slate-200">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={cn(
            'w-full flex items-center gap-3 py-4 px-6 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}