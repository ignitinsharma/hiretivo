import { cn } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <nav className={cn("sticky-nav bg-white/90 border-b border-brand-border h-20 flex items-center", className)} data-purpose="main-navigation">
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer" data-purpose="logo">
          <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
          <span className="text-heading text-xl font-extrabold tracking-tight">Hiretivo</span>
        </Link>
        {/* <div className="hidden lg:flex items-center gap-8 text-sm font-medium" data-purpose="nav-links">
          <Link className="text-brand-body hover:text-brand-primary transition-colors" href="/jobs">Browse Jobs</Link>
          <Link className="text-brand-body hover:text-brand-primary transition-colors" href="/companies">Companies</Link>
          <Link className="text-brand-body hover:text-brand-primary transition-colors" href="/salary">Salary Guide</Link>
        </div> */}
        <div className="flex items-center gap-3" data-purpose="nav-actions">
          <Link href="/recruiter/register" className="hidden sm:block px-5 py-2.5 border border-brand-primary/20 text-brand-primary bg-brand-light rounded-lg text-sm font-bold hover:bg-brand-primary hover:text-white transition-all btn-shadow">
            Hire Talent
          </Link>
          <Link href="/recruiter/register" className="hidden sm:block px-5 py-2.5 border border-brand-border rounded-lg text-sm font-semibold text-brand-heading hover:bg-gray-50 transition-all btn-shadow">
            Post a Job
          </Link>
          <Link href="/seeker/login" className="px-6 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all btn-shadow">
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}