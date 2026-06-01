'use client';

import { ArrowUpRight, Lock, Sparkles, Users, Calendar, Brain, Clock } from 'lucide-react';
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

const PAID_FEATURES = [
  { icon: Brain, label: 'AI Candidate Summaries' },
  { icon: Calendar, label: 'Schedule Interviews' },
  { icon: Users, label: 'Talent Pool Access' },
  { icon: Clock, label: '10 Active Job Posts' },
];

export function PaidFeatureModal() {
  const router = useRouter();
  const { paidFeatureModal, closePaidFeatureModal } = useUIStore();
  const { isOpen, title, description } = paidFeatureModal;

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
      <DialogContent className="rounded-xl backdrop-blur-sm sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-brand-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-semibold tracking-tight text-brand-foreground">
            {title || 'Unlock Paid Features'}
          </DialogTitle>
          <DialogDescription className="text-center text-brand-foreground-muted">
            {description || 'Upgrade to a paid plan to access all features.'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {PAID_FEATURES.map((feature) => (
            <div key={feature.label} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface">
                <feature.icon className="h-4 w-4 text-brand-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onUpgrade}
            variant="primary"
            className="w-full"
          >
            Upgrade Plan
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