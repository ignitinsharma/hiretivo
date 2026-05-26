import React from "react";

interface CompanySidebarProps {
  company: {
    website: string | null;
    companySize: string | null;
    industry: string | null;
    fundingType: string | null;
    isFullyRemote: boolean;
  };
  openRoleCount: number;
}

interface Fact {
  label: string;
  value: React.ReactNode;
}

export function CompanySidebar({ company, openRoleCount }: CompanySidebarProps) {
  const optionalFacts: Array<Fact | null> = [
    company.industry ? { label: "Industry", value: company.industry } : null,
    company.companySize ? { label: "Size", value: `${company.companySize} employees` } : null,
    company.fundingType ? { label: "Funding", value: company.fundingType } : null,
    company.isFullyRemote ? { label: "Work model", value: "Fully Remote" } : null,
    company.website
      ? {
          label: "Website",
          value: (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          ),
        }
      : null,
    {
      label: "Open roles",
      value: (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          {openRoleCount} active
        </span>
      ),
    },
  ];
  const facts = optionalFacts.filter((fact): fact is Fact => fact !== null);

  return (
    <div className="flex flex-col gap-8 w-full lg:w-80 shrink-0">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Company Quick Facts
        </h2>
        <div className="flex flex-col gap-4">
          {facts.map((fact, index) => (
            <div
              key={fact.label}
              className={index === facts.length - 1 ? "flex justify-between pt-1" : "flex justify-between border-b border-slate-50 pb-3"}
            >
              <span className="text-sm text-slate-500">{fact.label}</span>
              <span className="text-right text-sm font-semibold text-slate-900">
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
