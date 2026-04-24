'use client';

import { ArrowRight, CheckCircle2, FileText, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface StepCompleteProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function StepComplete({ onComplete, isLoading }: StepCompleteProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary-light mb-4">
          <CheckCircle2 className="w-8 h-8 text-brand-primary" />
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          <span className="text-sm text-muted-foreground">First job listing</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground text-left">Next steps</h3>
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onComplete}
            className="w-full justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">View your job listing</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onComplete}
            className="w-full justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Browse candidate profiles</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      <Button type="button" onClick={onComplete} size="lg" variant="primary" className="w-full mt-6" disabled={isLoading}>
        {isLoading ? 'Setting up your dashboard...' : 'Go to Dashboard'}
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Need help? Chat with support
      </p>
    </div>
  );
}