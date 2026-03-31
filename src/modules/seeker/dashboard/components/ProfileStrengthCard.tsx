import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfileStrengthCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-primary w-5 h-5" />
        <h3 className="font-bold text-slate-900">Profile Strength</h3>
      </div>
      
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
              Intermediate
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-primary">
              75%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-primary/20">
          <div
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
            style={{ width: '75%' }}
          ></div>
        </div>
      </div>
      
      <p className="text-slate-500 text-xs leading-relaxed">
        Add a professional bio to increase your visibility to recruiters by 40%.
      </p>
      <Button variant="brand-outline" size="full" className="mt-4 font-bold text-sm rounded-lg transition-colors">
        Improve Profile
      </Button>
    </div>
  );
}