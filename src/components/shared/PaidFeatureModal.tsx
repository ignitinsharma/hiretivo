'use client';

import { ArrowUpRight, Lock, Sparkles } from 'lucide-react';
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
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-black">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-semibold tracking-tight text-foreground ">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-[#868685] ">
            {description}
          </DialogDescription>
        </DialogHeader>

        <ul className="my-4 space-y-2 text-sm text-foreground ">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-black" />
            Search verified candidates instantly
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-black" />
            Schedule interviews and email applicants
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-black" />
            Cancel anytime with no contract
          </li>
        </ul>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onUpgrade}
            className="w-full rounded-full bg-brand-primary font-semibold text-white transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-black/30"
          >
            Upgrade to Pro
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={closePaidFeatureModal}
            className="w-full rounded-full transition-transform hover:scale-105 active:scale-95"
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
