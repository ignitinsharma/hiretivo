import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronDown,
  LogIn,
  UserPlus,
} from "lucide-react";

/*
 * PublicRecruiterDropdown
 * Uses CSS hover/focus-within for the desktop public recruiter menu. This avoids
 * the flicker caused by forcing a click menu into hover behavior.
 */
export function PublicRecruiterDropdown() {
  return (
    <div className="group relative">
      <button
        className="flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-slate-900 transition-colors hover:text-brand-primary focus:outline-none focus-visible:text-brand-primary xl:text-base"
        type="button"
      >
        For Recruiters
        <ChevronDown
          className="h-4 w-4 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
          aria-hidden="true"
        />
      </button>

      <div
        className="invisible absolute left-1/2 top-full z-50 w-96 -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        role="menu"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <Link
            href="/hire-talent"
            className="flex gap-4 px-5 py-4 transition-colors hover:bg-brand-surface focus:bg-brand-surface focus:outline-none"
            role="menuitem"
          >
            <div className="mt-1">
              <BriefcaseBusiness
                className="h-5 w-5 text-brand-primary"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">
                Hire Engineers
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Access pre-verified talent
              </p>
            </div>
          </Link>

          <div className="h-px bg-brand-border" />

          <Link
            href="/recruiter/login"
            className="flex gap-4 px-5 py-4 transition-colors hover:bg-brand-surface focus:bg-brand-surface focus:outline-none"
            role="menuitem"
          >
            <div className="mt-1">
              <LogIn className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">
                Recruiter Login
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Access your dashboard
              </p>
            </div>
          </Link>

          <Link
            href="/recruiter/register"
            className="flex gap-4 px-5 py-4 transition-colors hover:bg-brand-surface focus:bg-brand-surface focus:outline-none"
            role="menuitem"
          >
            <div className="mt-1">
              <UserPlus className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">
                Recruiter Sign Up
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Create your recruiter account
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
