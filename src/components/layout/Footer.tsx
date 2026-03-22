import { cn } from "@/lib/utils";
import Link from "next/link";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("bg-white border-t border-brand-border pt-16 pb-8", className)} data-purpose="main-footer">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">H</div>
              <span className="text-heading text-lg font-extrabold tracking-tight">Hiretivo</span>
            </Link>
            <p className="text-brand-body max-w-xs mb-6">Building the future of remote work. Connecting talent with world-class remote companies since 2021.</p>
          </div>
          <div>
            <h5 className="text-heading font-bold mb-4">Job Seekers</h5>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link className="text-brand-body hover:text-brand-primary" href="/jobs">Browse Jobs</Link></li>
              <li><Link className="text-brand-body hover:text-brand-primary" href="/alerts">Job Alerts</Link></li>
              <li><Link className="text-brand-body hover:text-brand-primary" href="/salary">Salary Guide</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-heading font-bold mb-4">Recruiters</h5>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link className="text-brand-body hover:text-brand-primary" href="/post-job">Post a Job</Link></li>
              <li><Link className="text-brand-body hover:text-brand-primary" href="/pricing">Pricing</Link></li>
              <li><Link className="text-brand-body hover:text-brand-primary" href="/talent-search">Talent Search</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-heading font-bold mb-4">Support</h5>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link className="text-brand-body hover:text-brand-primary" href="/help">Help Center</Link></li>
              <li><Link className="text-brand-body hover:text-brand-primary" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-brand-body hover:text-brand-primary" href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">© 2026 Hiretivo Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link className="text-gray-400 hover:text-brand-primary" href="#"><span className="material-symbols-outlined text-lg">share</span></Link>
            <Link className="text-gray-400 hover:text-brand-primary" href="#"><span className="material-symbols-outlined text-lg">public</span></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}