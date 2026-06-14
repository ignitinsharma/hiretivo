'use client';

import { usePathname } from 'next/navigation';

import { AccountMenu } from '@/components/shared/AccountMenu';

const ROUTE_TITLES: Record<string, string> = {
  '/recruiter/dashboard': 'Dashboard',
  '/recruiter/jobs': 'Active Jobs',
  '/recruiter/applications': 'Applicants Explorer',
  '/recruiter/talent': 'Find Talent',
  '/recruiter/settings': 'Recruiter Settings',
};

/*
 * getRecruiterHeaderTitle
 * Resolves the app-shell title from the current recruiter route.
 */
function getRecruiterHeaderTitle(pathname: string): string {
  if (pathname.startsWith('/recruiter/jobs/')) {
    return 'Job Details';
  }

  return ROUTE_TITLES[pathname] ?? 'Recruiter';
}

/*
 * RecruiterHeader
 * Global recruiter shell header with route title and profile account actions.
 */
export function RecruiterHeader() {
  const pathname = usePathname();
  const title = getRecruiterHeaderTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-brand-border bg-white px-4 sm:px-6">
      <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-brand-foreground">
        {title}
      </h1>

      <AccountMenu
        settingsHref="/recruiter/settings"
        fallbackName="Recruiter"
        fallbackEmail="Recruiter account"
        ariaLabel="Open recruiter account menu"
        className="ml-4"
      />
    </header>
  );
}
