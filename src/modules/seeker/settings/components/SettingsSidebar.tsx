import React from 'react';
import { User, Shield, CreditCard, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsSidebar() {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <nav className="sticky top-24 flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Settings
        </p>
        
        <a href="#account" className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors bg-primary/5 text-primary font-semibold">
          <User className="w-5 h-5" />
          <span className="text-sm">Account</span>
        </a>
        
        <a href="#security" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Shield className="w-5 h-5" />
          <span className="text-sm">Password & Security</span>
        </a>
        
        <a href="#billing" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm">Billing</span>
        </a>
        
        <div className="my-4 border-t border-slate-200"></div>
        
        <a href="#danger" className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm font-medium">Danger Zone</span>
        </a>
      </nav>
    </aside>
  );
}