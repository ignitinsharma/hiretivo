import React from 'react';
import { CalendarDays, HeartPulse, PieChart, Home, GraduationCap, Zap } from 'lucide-react';

const PERKS = [
  {
    icon: CalendarDays,
    title: 'Unlimited PTO',
    description: 'We trust you to manage your own schedule and take time when needed.',
  },
  {
    icon: HeartPulse,
    title: 'Health Coverage',
    description: 'Premium health, dental, and vision for you and your family.',
  },
  {
    icon: PieChart,
    title: 'Equity',
    description: 'Generous stock options. We want everyone to be an owner.',
  },
  {
    icon: Home,
    title: 'Fully Remote',
    description: 'Work from anywhere. We provide a $2,000 home office stipend.',
  },
  {
    icon: GraduationCap,
    title: 'Learning Budget',
    description: '$1,500 annual budget for books, courses, or conferences.',
  },
  {
    icon: Zap,
    title: 'Fast Iteration',
    description: 'We ship fast and learn constantly. No bureaucracy.',
  },
];

export function CompanyPerks() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-xl font-bold text-slate-900">Life at Acme</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PERKS.map((perk, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-slate-50 bg-slate-50 p-4">
            <perk.icon className="w-6 h-6 text-primary" />
            <p className="text-sm font-bold text-slate-900">{perk.title}</p>
            <p className="text-xs text-slate-500">{perk.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}