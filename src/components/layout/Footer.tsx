import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Twitter, Linkedin, Instagram } from "lucide-react";

interface FooterProps {
  className?: string;
}

const SOCIAL_LINKS = [
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
] as const;

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn("grainy-bg bg-black border border-white/10 rounded-3xl pt-24 pb-8 mx-4 md:mx-8 mb-8", className)}
      data-purpose="main-footer"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div className="md:max-w-md">
            <Link href="/" className="inline-block mb-6">
              <Logo variant="white" size="lg" />
            </Link>
            <p className="text-gray-500 text-base mb-8">
              Skills-based remote job portal connecting talented professionals with remote-first companies worldwide.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-primary hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 max-w-md shrink-0">
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm">Company</h5>
              <ul className="space-y-3 text-sm">
                <li><Link className="text-gray-500 hover:text-white transition-colors" href="/about">About</Link></li>
                <li><Link className="text-gray-500 hover:text-white transition-colors" href="/how">How It Works</Link></li>
                <li><Link className="text-gray-500 hover:text-white transition-colors" href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm">Legal</h5>
              <ul className="space-y-3 text-sm">
                <li><Link className="text-gray-500 hover:text-white transition-colors" href="/privacy">Privacy Policy</Link></li>
                <li><Link className="text-gray-500 hover:text-white transition-colors" href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mb-8 overflow-hidden">
          <span className="text-white text-[120px] md:text-[160px] lg:text-[200px] font-bold tracking-tighter leading-none opacity-5 select-none" aria-hidden="true">
            HIRETIVO
          </span>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-600 text-sm">© 2026 Hiretivo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
