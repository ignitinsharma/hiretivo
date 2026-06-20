import {
  Verified,
  Users,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";

interface CompanyHeaderProps {
  company: {
    name: string;
    logoUrl: string | null;
    website: string | null;
    bio: string | null;
    companySize: string | null;
    industry: string | null;
    fundingType: string | null;
    isFullyRemote: boolean;
  };
  openRoleCount: number;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function CompanyHeader({ company, openRoleCount }: CompanyHeaderProps) {
  const summary = company.industry ?? company.fundingType ?? `${openRoleCount} open ${openRoleCount === 1 ? 'role' : 'roles'}`;

  return (
    <div className="mb-8 rounded-xl border border-brand-border bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5 sm:gap-6">
            <div className="flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-xl border border-brand-border bg-white shadow-sm overflow-hidden">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl sm:text-2xl">
                  {getInitials(company.name)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {company.name}
                </h1>
                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5">
                  <Verified className="w-4 h-4 text-black" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-black">
                    Verified
                  </span>
                </div>
              </div>
              <p className="text-base sm:text-lg text-slate-500 mt-0.5">
                {summary}
              </p>

              <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
                {company.companySize && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{company.companySize} employees</span>
                  </div>
                )}
                {company.isFullyRemote && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Globe className="w-4 h-4" />
                    <span>Fully Remote</span>
                  </div>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>{company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
