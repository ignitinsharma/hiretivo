import { cn } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { LEGACY_SEEKER_HEADER_ITEMS, RECRUITER_NAV_ITEMS } from "@/constants/nav";
import { NavLink } from "@/components/layout/NavLink";
import { SeekerNavLink } from "@/components/layout/SeekerNavLink";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { PublicMobileNavMenu } from "@/components/layout/PublicMobileNavMenu";
import { BookCallButton } from "@/components/shared/BookCallButton";
import { PublicRecruiterDropdown } from "@/components/layout/PublicRecruiterDropdown";
import { RECRUITER_ENABLED } from "@/constants/flags";
import { Logo } from "@/components/shared/Logo";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";

interface HeaderProps {
  className?: string;
  publicAudience?: "seeker" | "recruiter";
  variant?: "dark" | "light";
}

/** Nav items to show — only Jobs and Applied Jobs, no Settings or Contact. */
const SEEKER_HEADER_ITEMS = LEGACY_SEEKER_HEADER_ITEMS.filter(
  (item) => item.href !== "/seeker/settings" && item.href !== "/contact",
);

/*
 * Header
 * Renders the shared top navigation for public, seeker, and recruiter views.
 * Returns mobile-first public auth controls and role-specific desktop nav.
 */
export async function Header({ className, variant = "light" }: HeaderProps) {
  const session = await auth();
  const role = session?.user?.role;
  const isSeeker = !!session && role === UserRole.SEEKER;
  const isRecruiter = !!session && role === UserRole.RECRUITER;

  if (!session) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-brand-surface px-4 py-3 md:px-6 md:py-4",
          className,
        )}
        data-purpose="main-navigation"
      >
        <div className="mx-auto max-w-440">
          <div className="flex h-16 items-center justify-between gap-4 rounded-3xl border border-brand-border-light bg-white px-5 shadow-[0_8px_40px_rgba(15,23,42,0.05)] md:px-7 lg:h-20">
            <Link href="/" className="flex items-center" data-purpose="logo">
              <Logo size="md" />
            </Link>

            <nav
              className="hidden items-center gap-7 lg:flex xl:gap-10"
              aria-label="Public navigation"
            >
              {RECRUITER_ENABLED && (
                <Link
                  href="/recruiter/talent"
                  className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-900 transition-colors hover:text-brand-primary xl:text-base"
                >
                  Verified Engineers
                </Link>
              )}

              <Link
                href="/how"
                className="whitespace-nowrap text-sm font-semibold text-slate-900 transition-colors hover:text-brand-primary xl:text-base"
              >
                How it Works
              </Link>

              <Link
                href="/pricing"
                className="whitespace-nowrap text-sm font-semibold text-slate-900 transition-colors hover:text-brand-primary xl:text-base"
              >
                Pricing
              </Link>

              {RECRUITER_ENABLED && <PublicRecruiterDropdown />}
            </nav>

            <div className="flex items-center gap-4">
              <BookCallButton variant="nav" />

              <Button
                asChild
                className="hidden h-11 rounded-2xl px-6 text-sm font-semibold lg:inline-flex xl:h-12 xl:px-7 xl:text-base"
                variant="secondary"
              >
                <Link href="/seeker/login">Sign In</Link>
              </Button>

              <Button
                asChild
                className="hidden h-11 rounded-2xl px-6 text-sm font-semibold lg:inline-flex xl:h-12 xl:px-7 xl:text-base"
                variant="primary"
              >
                <Link href="/seeker/register">Get Verified</Link>
              </Button>

              <PublicMobileNavMenu />
            </div>
          </div>
        </div>
      </header>
    );
  }

  let companyLogoUrl: string | null = null;
  let isSeekerVerified = false;
  if (isRecruiter && session?.user?.id) {
    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      select: { logo: true },
    });
    companyLogoUrl = resolveLogoUrl(recruiter?.logo);
  }
  if (isSeeker && session?.user?.id) {
    const seeker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verificationStatus: true },
    });
    isSeekerVerified = seeker?.verificationStatus === "VERIFIED";
  }

  const userImage = session?.user?.image;
  const userImageUrl = userImage ? resolveLogoUrl(userImage) : null;
  const avatarUrl = companyLogoUrl ?? userImageUrl;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b px-4 py-3 md:px-6",
        variant === "dark"
          ? "border-white/[0.07] bg-brand-foreground"
          : "border-brand-border bg-white",
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
              {RECRUITER_ENABLED && (
                <Link
                  href={"/recruiter/register"}
                  className={cn(
                    "hidden rounded-lg px-5 py-2.5 text-sm font-bold transition-colors sm:block",
                    variant === "dark"
                      ? "bg-brand-primary text-white hover:bg-brand-primary-dark"
                      : "border border-brand-primary/20 bg-brand-surface text-brand-foreground hover:bg-brand-primary hover:text-white",
                  )}
                >
                  I&apos;m a recruiter
                </Link>
              )}
              <Link
                href={"/seeker/register"}
                className={cn(
                  "hidden rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors sm:block",
                  variant === "dark"
                    ? "border border-white/10 text-white/50 hover:bg-white/5"
                    : "border border-brand-border text-brand-foreground hover:bg-brand-surface",
                )}
              >
                Sign Up
              </Link>
              <Link
                href={"/seeker/login"}
                className={cn(
                  "hidden rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors sm:block",
                  variant === "dark"
                    ? "border border-white/10 text-white/60 hover:bg-white/5"
                    : "bg-brand-primary text-white hover:bg-brand-primary-dark",
                )}
              >
                Sign In
              </Link>
              <PublicMobileNavMenu />
            </>
          )}

          {/* Logged-in avatar + dropdown — seeker or recruiter */}
          {session && (
            <div className="flex items-center gap-3 pl-4 border-l border-brand-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer flex items-center group outline-none">
                    <InitialsAvatar
                      name={session.user.name}
                      email={session.user.email}
                      userId={session.user.id}
                      image={avatarUrl}
                      fallbackSeed="header-avatar"
                      size="md"
                      verified={isSeekerVerified}
                      className="h-10 w-10 border-2 border-brand-primary/20 bg-brand-surface ring-2 ring-transparent transition-all group-hover:border-brand-primary"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl border-brand-border bg-white p-1 shadow-none">
                  <DropdownMenuLabel className="px-3 py-3">
                    <span className="block truncate text-sm font-semibold capitalize text-brand-foreground">
                      {session.user.name ?? (isSeeker ? "Job Seeker" : "Recruiter")}
                    </span>
                    <span className="mt-1 block truncate text-xs font-normal text-brand-foreground-muted">
                      {session.user.email ?? ""}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-brand-border" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                    <Link
                      href={isSeeker ? "/seeker/settings" : "/recruiter/settings"}
                      className="flex items-center gap-2 font-semibold"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg px-3 py-2 text-brand-danger focus:bg-brand-danger/10 focus:text-brand-danger"
                    asChild
                  >
                    <SignOutButton className="cursor-pointer px-3 py-2" />
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
