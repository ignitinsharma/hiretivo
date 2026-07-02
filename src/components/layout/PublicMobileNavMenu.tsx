"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  LogIn,
  Menu,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { BookCallButton } from "@/components/shared/BookCallButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RECRUITER_ENABLED } from "@/constants/flags";

const PUBLIC_MOBILE_NAV_ITEMS = [
  ...(RECRUITER_ENABLED
    ? [{ href: "/recruiter/talent", label: "Verified Engineers" }]
    : []),
  { href: "/how", label: "How it Works" },
  { href: "/pricing", label: "Pricing" },
] as const;

const PUBLIC_MOBILE_RECRUITER_ITEMS = [
  {
    href: "/hire-talent",
    label: "Hire Engineers",
    description: "Access pre-verified talent",
    icon: BriefcaseBusiness,
  },
  {
    href: "/recruiter/login",
    label: "Recruiter Login",
    description: "Access your dashboard",
    icon: LogIn,
  },
  {
    href: "/recruiter/register",
    label: "Recruiter Sign Up",
    description: "Create your recruiter account",
    icon: UserPlus,
  },
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
          className="lg:hidden"
          size="icon"
          variant="secondary"
        >
          <Menu aria-hidden="true" className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-3xl border-brand-border bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
      >
        {PUBLIC_MOBILE_NAV_ITEMS.map((item) => (
          <DropdownMenuItem asChild key={item.href}>
            <Link
              className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-brand-foreground focus:bg-brand-surface"
              href={item.href}
            >
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        {RECRUITER_ENABLED && (
          <>
            <DropdownMenuSeparator />
            {PUBLIC_MOBILE_RECRUITER_ITEMS.map((item) => (
              <DropdownMenuItem asChild key={item.href}>
                <Link
                  className="flex cursor-pointer gap-3 rounded-2xl px-4 py-3 focus:bg-brand-surface"
                  href={item.href}
                >
                  <item.icon
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-brand-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-brand-foreground-muted">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            className="flex cursor-pointer gap-3 rounded-2xl px-4 py-3 focus:bg-brand-surface"
            href="/seeker/login"
          >
            <LogIn
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
            />
            <span className="text-sm font-semibold text-brand-foreground">
              Sign In
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            className="flex cursor-pointer gap-3 rounded-2xl px-4 py-3 focus:bg-brand-surface"
            href="/seeker/register"
          >
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
            />
            <span className="text-sm font-semibold text-brand-foreground">
              Get Verified
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <BookCallButton variant="mobile" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
