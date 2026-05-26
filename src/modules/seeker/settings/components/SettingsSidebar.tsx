import React from "react";
import {
  User,
  Shield,
  Link,
  Code2,
  Briefcase,
  GraduationCap,
  Database,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "#account", label: "Account", icon: User },
  { href: "#social", label: "Social Profiles", icon: Link },
  { href: "#coding-profiles", label: "Coding Profiles", icon: Code2 },
  { href: "#experience", label: "Work Experience", icon: Briefcase },
  { href: "#education", label: "Education", icon: GraduationCap },
  { href: "#security", label: "Password & Security", icon: Shield },
  { href: "#privacy", label: "Privacy & Data", icon: Database },
] as const;

export function SettingsSidebar() {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <nav className="sticky top-24 flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-foreground-secondary px-3 mb-2">
          Settings
        </p>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-brand-foreground hover:bg-brand-surface rounded-lg transition-colors leading-loose"
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
