"use client";

import React, { useEffect, useState } from "react";
import { User, Shield, Link, Briefcase, GraduationCap, Award, FileText, FolderGit2, Sparkles, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#account", label: "Account", icon: User },
  { href: "#social", label: "Social Profiles", icon: Link },
  { href: "#experience", label: "Work Experience", icon: Briefcase },
  { href: "#education", label: "Education", icon: GraduationCap },
  { href: "#certifications", label: "Certifications", icon: Award },
  { href: "#projects", label: "Projects", icon: FolderGit2 },
  { href: "#application-defaults", label: "Application Defaults", icon: FileText },
  { href: "#optimize-mode", label: "Resume Optimize Mode", icon: Sparkles },
  { href: "#plans", label: "Plans & Credits", icon: Zap },
  { href: "#security", label: "Password & Security", icon: Shield },
] as const;

type SettingsHash = (typeof NAV_ITEMS)[number]["href"];

const DEFAULT_HASH: SettingsHash = "#account";
const NAV_HASHES = new Set(NAV_ITEMS.map((item) => item.href));

/*
 * isSettingsHash
 * Narrows arbitrary location hashes to supported seeker settings sections.
 */
function isSettingsHash(value: string): value is SettingsHash {
  return NAV_HASHES.has(value as SettingsHash);
}

/*
 * getActiveHashFromLocation
 * Reads the current settings hash and falls back to Account for unknown hashes.
 */
function getActiveHashFromLocation(): SettingsHash {
  if (typeof window === "undefined") return DEFAULT_HASH;
  return isSettingsHash(window.location.hash)
    ? window.location.hash
    : DEFAULT_HASH;
}

/*
 * SettingsSidebar
 * Sticky seeker settings section navigation that follows the current hash/section.
 */
export function SettingsSidebar() {
  const [activeHash, setActiveHash] = useState<SettingsHash>(DEFAULT_HASH);

  useEffect(() => {
    setActiveHash(getActiveHashFromLocation());

    const handleHashChange = (): void => {
      setActiveHash(getActiveHashFromLocation());
    };

    const sections = NAV_ITEMS.map((item) =>
      document.getElementById(item.href.slice(1)),
    ).filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry?.target.id) return;
        const nextHash = `#${visibleEntry.target.id}`;
        if (isSettingsHash(nextHash)) {
          setActiveHash(nextHash);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.1, 0.25],
      },
    );

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <aside className="w-full shrink-0 md:w-72">
      <nav className="sticky top-24 flex flex-col gap-3">
        <p className="px-6 text-xs font-bold uppercase tracking-wider text-brand-foreground-secondary">
          Settings
        </p>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            aria-current={activeHash === href ? "true" : undefined}
            className={cn(
              "flex items-center gap-5 rounded-xl border-l-4 border-transparent px-2 py-3 text-brand-foreground-muted transition-colors hover:bg-brand-surface hover:text-brand-foreground",
              activeHash === href &&
                "border-brand-primary bg-brand-primary/5 text-brand-primary",
            )}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="text-base font-medium">{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
