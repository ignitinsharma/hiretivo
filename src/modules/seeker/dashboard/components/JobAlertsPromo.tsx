import React from 'react';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function JobAlertsPromo() {
  return (
    <div className="bg-primary p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Megaphone className="w-[100px] h-[100px]" />
      </div>
      <h4 className="font-bold text-lg relative z-10">Get new matches!</h4>
      <p className="text-primary-foreground/90 text-sm mt-2 mb-4 relative z-10">
        We'll notify you as soon as a job matching your profile is posted.
      </p>
      <Button variant="secondary" size="full" className="font-black text-sm relative z-10 transition-colors">
        Enable Alerts
      </Button>
    </div>
  );
}