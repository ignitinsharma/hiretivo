import React from 'react';
import { User, Shield, CreditCard, Trash2, Link, Briefcase, GraduationCap } from 'lucide-react';

const NAV_ITEMS = [
  { href: '#account', label: 'Account', icon: User },
  { href: '#social', label: 'Social Profiles', icon: Link },
  { href: '#experience', label: 'Work Experience', icon: Briefcase },
  { href: '#education', label: 'Education', icon: GraduationCap },
  { href: '#security', label: 'Password & Security', icon: Shield },
  { href: '#billing', label: 'Billing', icon: CreditCard },
] as const;

export function SettingsSidebar() {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <nav className="sticky top-24 flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Settings
        </p>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors leading-loose"
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">{label}</span>
          </a>
        ))}

        <div className="my-4 border-t border-slate-200" />

        <a
          href="#danger"
          className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors leading-loose"
        >
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">Danger Zone</span>
        </a>
      </nav>
    </aside>
  );
}
