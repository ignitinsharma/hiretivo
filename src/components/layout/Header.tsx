import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { SEEKER_NAV_ITEMS, RECRUITER_NAV_ITEMS } from "@/constants/nav";
import { NavLink } from "@/components/layout/NavLink";
import { SeekerNavLink } from "@/components/layout/SeekerNavLink";
import { ChevronDown, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { PublicMobileNavMenu } from "@/components/layout/PublicMobileNavMenu";
import { Logo } from "@/components/shared/Logo";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";

interface HeaderProps {
  className?: string;
  publicAudience?: "seeker" | "recruiter";
}

/** Nav items to show — only Jobs and Applied Jobs, no Settings or Contact. */
const SEEKER_HEADER_ITEMS = SEEKER_NAV_ITEMS.filter(
  (item) => item.href !== "/seeker/settings" && item.href !== "/contact",
);

/*
 * Header
 * Renders the shared top navigation for public, seeker, and recruiter views.
 * Returns mobile-first public auth controls and role-specific desktop nav.
 */
export async function Header({ className }: HeaderProps) {
  const session = await auth();
  const role = session?.user?.role;
  const isSeeker = !!session && role === UserRole.SEEKER;
  const isRecruiter = !!session && role === UserRole.RECRUITER;

  const initials = session?.user?.name?.[0]?.toUpperCase() ?? "U";
  let companyLogoUrl: string | null = null;
  if (isRecruiter && session?.user?.id) {
    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      select: { logo: true },
    });
    companyLogoUrl = resolveLogoUrl(recruiter?.logo);
  }

  const userImage = session?.user?.image;
  const userImageUrl = userImage ? resolveLogoUrl(userImage) : null;
  const avatarUrl = companyLogoUrl ?? userImageUrl;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-brand-border bg-white px-4 py-3 md:px-6",
        className,
      )}
      data-purpose="main-navigation"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href={
            session
              ? isRecruiter
                ? "/recruiter/dashboard"
                : "/seeker/dashboard"
              : "/"
          }
          className="flex items-center"
          data-purpose="logo"
        >
          <Logo />
        </Link>

        {/* Seeker nav links */}
        {isSeeker && (
          <nav
            className="hidden md:flex flex-1 justify-center gap-8"
            aria-label="Seeker navigation"
          >
            {SEEKER_HEADER_ITEMS.map((item) => (
              <SeekerNavLink
                key={item.href}
                href={item.href}
                iconName={item.iconName}
                label={item.label}
              />
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
                href={"/recruiter/register"}
                className="hidden rounded-lg border border-brand-primary/20 bg-brand-surface px-5 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-primary hover:text-white sm:block"
              >
                I&apos;m a recruiter
              </Link>
              <Link
                href={"/seeker/register"}
                className="hidden rounded-lg border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-surface sm:block"
              >
                Sign Up
              </Link>
              <Link
                href={"/seeker/login"}
                className="hidden rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark sm:block"
              >
                Sign In
              </Link>
              <PublicMobileNavMenu />
            </>
          )}

          {/* Logged-in avatar + dropdown — seeker or recruiter */}
          {session && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer flex items-center gap-2 group outline-none">
                    <div className="w-9 h-9 overflow-hidden rounded-full bg-black/10 border-2 border-brand-primary/20 flex items-center justify-center text-black font-bold text-sm ring-2 ring-transparent transition-all group-hover:border-black">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={initials}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
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
                      className="flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <SignOutButton className="cursor-pointer px-2 py-1.5" />
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
