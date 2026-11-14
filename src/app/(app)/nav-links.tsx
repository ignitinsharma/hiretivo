"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { isCurrent, NAV } from "@/lib/nav";

import { useSidebarCollapsed } from "./sidebar-frame";

/** The sidebar's navigation, with the current section highlighted. */
export function NavLinks() {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
      {NAV.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = isCurrent(item, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-medium hover:bg-hover hover:text-ink motion-safe:transition-colors",
              collapsed && "relative justify-center px-1.5",
              // One or the other: cn() doesn't merge, so both would leave the CSS order to pick.
              active ? "bg-hover font-semibold text-ink" : "text-muted",
            )}
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
