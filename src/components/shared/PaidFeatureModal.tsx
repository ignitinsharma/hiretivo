'use client';

import { ArrowUpRight, Lock, Sparkles, Users, Calendar, Brain, Clock, FileText, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/use-ui-store';

const FEATURE_SETS: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }[]> = {
  resume_generation: [
    { icon: Sparkles, label: '20 Resume Generations/mo' },
    { icon: FileText, label: 'AI Cover Letters' },
    { icon: RefreshCw, label: 'Unlimited Regenerations' },
    { icon: Clock, label: 'Priority Generation' },
  ],
};

const DEFAULT_FEATURES = [
  { icon: Brain, label: 'AI Candidate Summaries' },
  { icon: Calendar, label: 'Schedule Interviews' },
  { icon: Users, label: 'Talent Pool Access' },
  { icon: Clock, label: '10 Active Job Posts' },
];

export function PaidFeatureModal() {
  const router = useRouter();
  const { paidFeatureModal, closePaidFeatureModal } = useUIStore();
  const { isOpen, title, description, feature } = paidFeatureModal;

  const features = feature ? (FEATURE_SETS[feature] ?? DEFAULT_FEATURES) : DEFAULT_FEATURES;

  const onUpgrade = () => {
    closePaidFeatureModal();
    router.push('/pricing');
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closePaidFeatureModal();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl backdrop-blur-sm sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-semibold tracking-tight text-foreground">
            {title || 'Unlock Pro Features'}
          </DialogTitle>
          <DialogDescription className="text-center text-[#868685]">
            {description || 'Upgrade to Pro to access all features.'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {features.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface">
                <item.icon className="h-4 w-4 text-brand-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onUpgrade}
            className="w-full rounded-lg bg-brand-primary font-semibold text-white transition-transform hover:scale-105 active:scale-95 hover:bg-brand-primary-dk"
          >
            Upgrade to Pro
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={closePaidFeatureModal}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
