'use client';

import { ArrowRight, CheckCircle2, Rocket, Code, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSeekerOnboardingStore } from '@/store/use-seeker-onboarding-store';

interface StepSeekerCompleteProps {
  onComplete: () => void;
}

const SAMPLE_JOBS = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    salary: '$140k–$160k',
    icon: Code,
  },
  {
    id: '2',
    title: 'React Developer',
    company: 'Vercel',
    salary: '$120k–$145k',
    icon: Rocket,
  },
  {
    id: '3',
    title: 'Full Stack Engineer',
    company: 'Linear',
    salary: '$130k–$155k',
    icon: Code,
  },
];

export function StepSeekerComplete({ onComplete }: StepSeekerCompleteProps) {
  const { completeOnboarding } = useSeekerOnboardingStore();

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">
            You&apos;re ready!
          </h2>
          <p className="text-lg text-muted-foreground">
            Your profile is live! We found <span className="font-semibold text-primary">48</span> remote jobs matching your profile.
          </p>
        </div>

        <div className="space-y-3 py-4">
          {SAMPLE_JOBS.map((job) => {
            const Icon = job.icon;
            return (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.company} • {job.salary}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Apply
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-lg py-3 px-4">
          <p className="text-sm text-muted-foreground">
            + 45 more jobs waiting for you
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button type="button" onClick={handleComplete} size="lg" className="w-full">
            Browse All Matched Jobs
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button type="button" variant="default" size="lg" className="w-full">
            Complete my full profile
          </Button>
        </div>

        <div className="pt-4">
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Set up job alerts
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need help? Chat with support
        </p>
      </div>
    </div>
  );
}
