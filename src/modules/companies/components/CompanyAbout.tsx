import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CompanyAbout() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">About Acme Corp</h2>
      <div className="prose prose-slate max-w-none text-slate-500">
        <p>
          At Acme Corp, we believe that the best work happens when people have the freedom to choose their environment. Since 2018, we have been building tools that bridge the gap between physical and digital offices. Our flagship platform is used by over 5,000 teams worldwide to foster genuine connection in a distributed world.
        </p>
        <p className="mt-4">
          We are a design-led engineering company focused on solving the toughest problems in real-time collaboration. Our culture is built on radical transparency, asynchronous workflows, and a deep respect for deep work.
        </p>
      </div>
      <Button variant="link" size="sm" className="mt-6 flex items-center gap-1 font-bold px-0">
        Read more about our mission <ArrowRight className="w-4 h-4" />
      </Button>
    </section>
  );
}