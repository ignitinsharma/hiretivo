import { cn } from "@/lib/utils";
import Link from "next/link";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn("grainy-bg bg-black border border-white/10 rounded-3xl pt-24 pb-8 mx-4 md:mx-8 mb-8", className)}
      data-purpose="main-footer"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center text-center mb-16">
          <Link href="/" className="inline-block mb-8">
            <span className="text-white text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-none">
              HIRETIVO
            </span>
          </Link>
          <p className="text-gray-500 max-w-md text-base mb-8">
            Skills-based remote job portal connecting talented professionals with remote-first companies worldwide.
          </p>
          <div className="flex gap-3">
            <Link className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </Link>
            <Link className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </Link>
            <Link className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors" href="https://github.com" target="_blank" rel="noopener noreferrer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-16 max-w-lg mx-auto">
          <div className="text-center">
            <h5 className="text-white font-semibold mb-4 text-sm">Company</h5>
            <ul className="space-y-3 text-sm">
              <li><Link className="text-gray-500 hover:text-white transition-colors" href="/about">About</Link></li>
              <li><Link className="text-gray-500 hover:text-white transition-colors" href="/how">How It Works</Link></li>
              <li><Link className="text-gray-500 hover:text-white transition-colors" href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="text-center">
            <h5 className="text-white font-semibold mb-4 text-sm">Legal</h5>
            <ul className="space-y-3 text-sm">
              <li><Link className="text-gray-500 hover:text-white transition-colors" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-gray-500 hover:text-white transition-colors" href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-600 text-sm">© 2026 Hiretivo Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
