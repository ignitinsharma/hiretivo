'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket, Check, Linkedin, Twitter, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { earlyAccessSchema, type EarlyAccessInput } from '@/lib/validations/early-access.schema';
import { earlyAccessService } from '@/services/early-access.service';

const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/hiretivo/',
  twitter: 'https://x.com/hiretivo',
  instagram: 'https://www.instagram.com/hire.tivo/',
} as const;

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  variant: 'primary' | 'light' | 'white';
  span?: 'full' | 'half';
}

/*
 * FeatureCard
 * Single feature card used in the coming-soon grid.
 * @param icon - Material Symbols icon name
 * @param title - Card heading
 * @param description - Card body text
 * @param variant - primary (purple bg), light (surface bg), or white (white bg)
 * @param span - full width or half width on desktop
 */
function FeatureCard({ icon, title, description, variant, span = 'half' }: FeatureCardProps) {
  const variantClasses = {
    primary: 'bg-brand-primary text-brand-primary-foreground relative overflow-hidden group',
    light: 'bg-brand-surface border border-brand-border',
    white: 'bg-white border border-brand-border',
  };

  const iconBgClasses = {
    primary: 'bg-white/20',
    light: 'bg-brand-surface',
    white: 'bg-brand-surface',
  };

  const iconColorClasses = {
    primary: 'text-brand-primary-foreground',
    light: 'text-brand-primary',
    white: 'text-brand-primary',
  };

  return (
    <div
      className={cn(
        'p-6 md:p-8 rounded-[2rem] flex flex-col justify-between transition-all duration-300',
        span === 'full' ? 'md:col-span-2' : '',
        variantClasses[variant],
      )}
    >
      {variant === 'primary' && (
        <div className="absolute top-8 right-8 opacity-15 transform group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <span className="material-symbols-outlined text-[120px]">auto_awesome</span>
        </div>
      )}
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center mb-5', iconBgClasses[variant])}>
        <span className={cn('material-symbols-outlined text-2xl', iconColorClasses[variant])}>{icon}</span>
      </div>
      <div className="relative z-10">
        <h3 className={cn('font-bold text-lg md:text-xl mb-2', variant === 'primary' ? 'text-brand-primary-foreground' : 'text-brand-foreground')}>{title}</h3>
        <p className="text-sm leading-relaxed opacity-90">{description}</p>
      </div>
    </div>
  );
}

/*
 * ComingSoonPage
 * Full-page coming soon / launch teaser for Hiretivo v3.
 * Job-seeker focused: AI resume tailoring, cover letters, skill matching, mock interviews, and more.
 * Lives behind NEXT_PUBLIC_SHOW_COMING_SOON=true env flag.
 */
export function ComingSoonPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EarlyAccessInput>({
    resolver: zodResolver(earlyAccessSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: EarlyAccessInput) => {
    setApiError('');

    try {
      await earlyAccessService.joinWaitlist(data);
      setIsSuccess(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface font-sans antialiased">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-brand-primary/5 blur-[100px]" />
      </div>

      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-brand-border/80">
        <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" />
          </Link>
        </nav>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <section className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface text-brand-foreground text-xs font-semibold tracking-widest uppercase mb-8 border border-brand-border">
            <Rocket className="w-4 h-4" />
            Launching Soon
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-brand-foreground mb-4 leading-none">
            Your Next Job,<br />
            <span className="text-brand-primary">Faster.</span>
          </h1>

          <p className="text-xl md:text-2xl text-brand-foreground-muted font-medium mb-12">
            AI-powered tools for every step of your job search
          </p>

          <div className="w-full max-w-lg mx-auto space-y-4">
            {isSuccess ? (
              <div className="p-8 bg-white rounded-xl border border-brand-border text-center">
                <div className="h-16 w-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-brand-foreground mb-2">You&apos;re on the list</h3>
                <p className="text-brand-foreground-muted">We&apos;ll notify you when we launch.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-xl md:rounded-full border border-brand-border"
              >
                <div className="flex-grow relative">
                  <input
                    type="email"
                    placeholder="Enter your work email"
                    {...register('email')}
                    className={cn(
                      'w-full px-8 py-4 bg-transparent border-none focus:ring-0 text-brand-foreground placeholder:text-brand-foreground-secondary focus:outline-none rounded-xl md:rounded-full',
                      errors.email && 'text-brand-danger',
                    )}
                  />
                  {errors.email && (
                    <p className="absolute left-8 top-full mt-1 text-xs text-brand-danger text-left">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="px-10 py-4 bg-brand-primary text-brand-primary-foreground font-medium text-sm rounded-xl md:rounded-full hover:bg-brand-primary-dk active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                >
                  {isSubmitting ? 'Submitting...' : 'Get Early Access'}
                </button>
              </form>
            )}
            {apiError && (
              <p className="text-brand-danger text-sm text-center">{apiError}</p>
            )}
            <p className="text-sm text-brand-foreground-muted">
              Join 1,000+ job seekers getting hired faster with AI.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <FeatureCard
            icon="auto_awesome"
            title="AI Resume Tailoring"
            description="Upload your resume once. Our AI tailors it for every job — matching keywords, formatting, and tone automatically."
            variant="primary"
            span="full"
          />
          <FeatureCard
            icon="description"
            title="Cover Letter Generation"
            description="Personalized cover letters in seconds. No templates. No copy-paste. Just a letter that reads like you wrote it."
            variant="white"
          />
          <FeatureCard
            icon="psychology"
            title="Skill-Based Matching"
            description="Instant match score showing exactly how your skills stack up against the job — not keywords, real overlap."
            variant="light"
          />
          <FeatureCard
            icon="notifications"
            title="Curated Job Feed"
            description="Remote jobs that match your skills. Smart alerts so you never miss a role that fits your profile."
            variant="white"
          />
          <FeatureCard
            icon="bar_chart"
            title="ATS Resume Score"
            description="Free ATS-compatibility check. Know instantly whether your resume makes it past the bots before you apply."
            variant="light"
          />
          <FeatureCard
            icon="mic"
            title="AI Mock Interviews"
            description="Practice with AI. Get real-time feedback on your answers and walk into interviews prepared and confident."
            variant="white"
          />
        </section>
      </main>

      <footer className="w-full py-16 bg-transparent border-t border-brand-border">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-brand-foreground-secondary text-xs tracking-widest uppercase">© 2026 Hiretivo Inc.</span>
          </div>
          <div className="flex gap-4">
            <Link
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-brand-surface flex items-center justify-center text-brand-foreground-muted hover:text-brand-foreground hover:bg-brand-border transition-all"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-brand-surface flex items-center justify-center text-brand-foreground-muted hover:text-brand-foreground hover:bg-brand-border transition-all"
            >
              <Twitter className="w-5 h-5" />
            </Link>
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-brand-surface flex items-center justify-center text-brand-foreground-muted hover:text-brand-foreground hover:bg-brand-border transition-all"
            >
              <Instagram className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
