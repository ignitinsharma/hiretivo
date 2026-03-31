import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showRecruiterToggle?: boolean;
  recruiterMode?: boolean;
  onToggleMode?: () => void;
  toggleLinkText?: string;
  toggleLinkHref?: string;
  leftContent?: React.ReactNode;
}

export function AuthLayout({
  children,
  title,
  description,
  leftContent,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-white selection:bg-brand-primary/20 antialiased overflow-x-hidden">
      {/* Left Side: Visual Storytelling */}
      <section className="hidden md:flex md:w-1/2 bg-[#f8f8fd] relative flex-col justify-center items-center px-8 lg:px-16 overflow-hidden">
        {leftContent}
      </section>

      {/* Right Side: Auth Form */}
      <section className={cn(
        "w-full flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-16",
        leftContent ? "md:w-1/2" : "md:w-full items-center"
      )}>
        <div className="w-full max-w-md mx-auto">
          {/* Mobile-only header info / branding */}
          <div className="md:hidden mb-12">
            <Link href="/" className="inline-flex items-center gap-2">
              <LogoIcon className="h-6 w-6" />
              <span className="text-brand-primary font-bold text-xl tracking-tighter">Hiretivo</span>
            </Link>
          </div>

          <header className="mb-10 text-center md:text-left">
            <h2 className="font-extrabold text-3xl text-slate-900 tracking-tight mb-3">
              {title}
            </h2>
            {description && (
              <p className="text-slate-500 font-medium">{description}</p>
            )}
          </header>

          <div className="space-y-8">{children}</div>

          <div className="mt-20 flex flex-wrap justify-center gap-8">
            <Link
              href="/privacy"
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/help"
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-900 transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#5c54e6" />
      <path
        d="M8 22L12 10L16 18L20 10L24 22"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" fill="white" />
      <circle cx="20" cy="10" r="2" fill="white" />
    </svg>
  );
}

