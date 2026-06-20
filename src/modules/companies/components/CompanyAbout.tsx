import React from 'react';

interface CompanyAboutProps {
  companyName: string;
  bio: string;
}

export function CompanyAbout({ companyName, bio }: CompanyAboutProps) {
  return (
    <section className="rounded-xl border border-brand-border bg-white p-8 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">About {companyName}</h2>
      <div className="prose prose-slate max-w-none text-slate-500">
        {bio.split(/\n{2,}/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
