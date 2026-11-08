"use client";

import React from "react";
import { User, Globe, Wrench, FileText, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SELF_HOSTED } from "@/lib/config";

export type SettingsTab = "personal" | "social" | "skills" | "resume" | "billing" | "password";

interface NavItem {
  key: SettingsTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "social", label: "Social Profiles", icon: Globe },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "resume", label: "Resume", icon: FileText },
  ...(!SELF_HOSTED ? [{ key: "billing" as const, label: "Plan & Billing", icon: CreditCard }] : []),
  { key: "password", label: "Password", icon: ShieldCheck },
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/*
 * SettingsSidebar
 * Professional SaaS settings navigation with icon + label items.
 * Active state: brand background, primary text, left accent border.
 * Inactive state: subtle hover background.
 * Responsive: vertical sidebar on desktop, horizontal scrollable tabs on mobile.
 */
export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <>
      {/* Desktop vertical sidebar */}
      <aside className="hidden md:block w-56 lg:w-60 shrink-0">
        <nav className="sticky top-24 flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm font-medium rounded-r-lg border-l-2 transition-colors",
                  isActive
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-transparent text-brand-foreground-muted hover:bg-brand-surface hover:text-brand-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile horizontal scrollable tabs */}
      <nav className="md:hidden -mx-6 px-6 pb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-brand-foreground-muted bg-brand-surface hover:bg-brand-surface/80",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
