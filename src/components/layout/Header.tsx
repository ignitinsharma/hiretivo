import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { SEEKER_NAV_ITEMS, RECRUITER_NAV_ITEMS } from "@/constants/nav";
import { NavLink } from "@/components/layout/NavLink";
import { ChevronDown, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/layout/SignOutButton";

interface HeaderProps {
  className?: string;
}

export async function Header({ className }: HeaderProps) {
  const session = await auth();
  const role = session?.user?.role;
  const isSeeker = !!session && role === UserRole.SEEKER;
  const isRecruiter = !!session && role === UserRole.RECRUITER;

  return (
    <nav
      className={cn(
        "sticky-nav bg-white/90 border-b border-brand-border h-20 flex items-center",
        className,
      )}
      data-purpose="main-navigation"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex items-center justify-between">
        {/* Logo — unchanged */}
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer"
          data-purpose="logo"
        >
          <Image
            src="/images/logo.png"
            alt="Hiretivo"
            width={120}
            height={40}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>

        {/* Seeker nav links */}
        {isSeeker && (
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            {SEEKER_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        )}

        {/* Recruiter nav links */}
        {isRecruiter && (
          <nav className="hidden md:flex flex-1 justify-center gap-6">
            {RECRUITER_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        )}

        {/* Nav actions */}
        <div className="flex items-center gap-3" data-purpose="nav-actions">
          {/* Public nav — no session */}
          {!session && (
            <>
              <Link
                href="/recruiter/register"
                className="hidden sm:block px-5 py-2.5 border border-brand-border rounded-lg text-sm font-semibold text-brand-heading hover:bg-gray-50 transition-all btn-shadow"
              >
                Register
              </Link>
              <Link
                href="/seeker/login"
                className="hidden sm:block px-5 py-2.5 border border-brand-border rounded-lg text-sm font-semibold text-brand-heading hover:bg-gray-50 transition-all btn-shadow"
              >
                Sign In
              </Link>
              <Link
                href="/recruiter/register"
                className="hidden sm:block px-5 py-2.5 border border-brand-primary/20 text-brand-primary bg-brand-light rounded-lg text-sm font-bold hover:bg-brand-primary hover:text-white transition-all btn-shadow"
              >
                Hire Talent
              </Link>
            </>
          )}

          {/* Logged-in avatar + dropdown — seeker or recruiter */}
          {session && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer flex items-center gap-2 group outline-none">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm ring-2 ring-transparent transition-all group-hover:border-brand-primary">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        isSeeker ? "/seeker/settings" : "/recruiter/settings"
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <SignOutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
