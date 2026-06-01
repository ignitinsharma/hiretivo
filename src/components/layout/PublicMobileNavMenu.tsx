"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PUBLIC_MOBILE_NAV_ITEMS = [
  { href: "/recruiter/register", label: "I'm a recruiter" },
  { href: "/recruiter/login", label: "Recruiter sign in" },
  { href: "/seeker/register", label: "Sign up" },
  { href: "/seeker/login", label: "Seeker sign in" },
] as const;

/*
 * PublicMobileNavMenu
 * Renders mobile-only public auth navigation for signed-out visitors.
 * Returns a dropdown menu with seeker and recruiter authentication links.
 */
export function PublicMobileNavMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open navigation menu"
          className="sm:hidden"
          size="icon"
          variant="secondary"
        >
          <Menu aria-hidden="true" className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-xl border-brand-border bg-white p-2 shadow-none"
      >
        {PUBLIC_MOBILE_NAV_ITEMS.map((item) => (
          <DropdownMenuItem asChild key={item.href}>
            <Link
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-foreground focus:bg-brand-surface"
              href={item.href}
            >
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
