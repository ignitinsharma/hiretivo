import { cn } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";
import { SeekerNavLink } from "@/components/layout/SeekerNavLink";
import { Menu, Settings } from "lucide-react";
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
import { Logo } from "@/components/shared/Logo";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";

interface HeaderProps {
  className?: string;
  variant?: "dark" | "light";
}

const SEEKER_HEADER_ITEMS = SEEKER_NAV_ITEMS.filter(
  (item) => item.href !== "/seeker/settings",
);

export async function Header({ className, variant = "light" }: HeaderProps) {
  const session = await auth();
  const role = session?.user?.role;
  const isSeeker = !!session && role === UserRole.SEEKER;

  if (!session) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-brand-border bg-white px-4 py-3 md:px-6",
          className,
        )}
        data-purpose="main-navigation"
      >
        <div className="mx-auto flex h-12 items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center" data-purpose="logo">
            <Logo size="md" />
          </Link>

          <nav
            className="hidden items-center gap-6 lg:flex"
            aria-label="Public navigation"
          >
            <Link
              href="/pricing"
              className="text-sm font-medium text-brand-foreground-muted hover:text-brand-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/seeker/login"
              className="text-sm font-medium text-brand-foreground-muted hover:text-brand-foreground transition-colors"
            >
              Sign In
            </Link>
            <Button asChild variant="primary" size="sm">
              <Link href="/seeker/register">Get Verified</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  let isSeekerVerified = false;
  if (isSeeker && session?.user?.id) {
    const seeker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verificationStatus: true },
    });
    isSeekerVerified = seeker?.verificationStatus === "VERIFIED";
  }

  const userImage = session?.user?.image;
  const userImageUrl = userImage ? resolveLogoUrl(userImage) : null;

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
        <Link
          href="/seeker/dashboard"
          className="flex items-center"
          data-purpose="logo"
        >
          <Logo />
        </Link>

        {isSeeker && (
          <nav
            className="hidden md:flex flex-1 justify-center gap-8"
            aria-label="Seeker navigation"
          >
            {SEEKER_HEADER_ITEMS.map((item) => (
              <SeekerNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3" data-purpose="nav-actions">
          {session && (
            <div className="flex items-center gap-3 pl-4 border-l border-brand-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer flex items-center group outline-none">
                    <InitialsAvatar
                      name={session.user.name}
                      email={session.user.email}
                      userId={session.user.id}
                      image={userImageUrl}
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
                      {session.user.name ?? "Job Seeker"}
                    </span>
                    <span className="mt-1 block truncate text-xs font-normal text-brand-foreground-muted">
                      {session.user.email ?? ""}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-brand-border" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                    <Link
                      href="/seeker/settings"
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
