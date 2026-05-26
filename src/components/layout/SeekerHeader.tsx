"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Settings,
  LogOut,
  User,
  Briefcase,
  Send,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Returns the user's initials (up to 2 chars) from their display name. */
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Nav items to show — only Jobs and Applied Jobs per D-18. */
const NAV_ITEMS = SEEKER_NAV_ITEMS.filter(
  (item) => item.href !== "/seeker/settings" && item.href !== "/contact",
);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  send: Send,
};

function getAvatarUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `/api/logo?key=${encodeURIComponent(image)}`;
}

export function SeekerHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = getInitials(session?.user?.name);
  const avatarUrl = getAvatarUrl(session?.user?.image);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 group outline-none"
                aria-label="Account menu"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold text-sm ring-2 ring-transparent transition-all group-hover:border-primary">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={initials} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {session?.user?.name && (
                <>
                  <div className="px-2 py-1.5 flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">{session.user.name}</span>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link
                  href="/seeker/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2 cursor-pointer"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
