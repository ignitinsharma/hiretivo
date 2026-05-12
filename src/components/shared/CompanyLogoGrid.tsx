"use client";

import { useState } from "react";
import { FAKE_COMPANIES, getCompanyLogoUrl } from "@/constants/fake-jobs";

interface CompanyLogoGridProps {
  className?: string;
}

function CompanyLogoCell({ name }: { name: string }) {
  const [showFallback, setShowFallback] = useState(false);

  return (
    <div className="flex h-12 items-center justify-center rounded-lg border border-brand-border bg-white p-2 transition-colors hover:border-brand-primary/40">
      {showFallback ? (
        <span className="text-sm font-bold text-brand-primary">
          {name.charAt(0)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name} logo`}
          className="max-h-7 max-w-full object-contain opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
          src={getCompanyLogoUrl(name)}
          onError={() => setShowFallback(true)}
        />
      )}
    </div>
  );
}

export function CompanyLogoGrid({ className }: CompanyLogoGridProps) {
  const companies = FAKE_COMPANIES.slice(0, 100);

  return (
    <section className={className} data-purpose="trusted-companies">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-brand-foreground-muted">
          Trusted by teams at
        </p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
          {companies.map((name) => (
            <CompanyLogoCell key={name} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
