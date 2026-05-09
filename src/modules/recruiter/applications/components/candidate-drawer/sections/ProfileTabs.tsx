import type { TabKey } from "../types";
import { TABS } from "../types";

interface ProfileTabsProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex rounded-xl border border-brand-border bg-brand-surface p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={
            activeTab === tab.key
              ? "flex-1 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary"
              : "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-foreground-muted"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
