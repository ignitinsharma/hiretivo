'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ExternalRedirectionPage() {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <span className="text-xl font-bold tracking-tight">Hiretivo</span>
          </div>
        </div>

        <section className="bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <ExternalLink className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            You're heading to TechFlow's site
          </h2>
          <p className="text-slate-500 leading-relaxed mb-8 px-2">
            Hiretivo helps you find the job, but the application happens on their platform. Good luck!
          </p>

          <div className="space-y-4">
            <Link
              href="#"
              className="block w-full py-3.5 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm"
            >
              Continue to Application
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="block w-full font-medium transition-colors"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>

          <div className="mt-10">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
              Redirecting in <span>{timeLeft}</span> seconds
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-1000 ease-linear origin-left"
                style={{ width: `${(timeLeft / 5) * 100}%` }}
              />
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Secure redirection to verified partner
          </p>
        </footer>
      </main>
    </div>
  );
}