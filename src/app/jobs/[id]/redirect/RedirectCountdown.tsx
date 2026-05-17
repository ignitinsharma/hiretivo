"use client";

import { useEffect, useState } from "react";

interface RedirectCountdownProps {
  targetUrl: string;
}

/**
 * Client component that manages the auto-redirect countdown.
 * Decrements from 5 and redirects to targetUrl when it reaches 0.
 */
export function RedirectCountdown({ targetUrl }: RedirectCountdownProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetUrl]);

  return (
    <div className="mt-10">
      <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
        Redirecting in <span>{countdown}</span> seconds
      </div>
      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full origin-left transition-all duration-1000"
          style={{ width: `${(countdown / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}
