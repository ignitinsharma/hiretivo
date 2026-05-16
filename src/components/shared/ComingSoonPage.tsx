'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rocket, Check, Linkedin, Twitter, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { earlyAccessSchema, type EarlyAccessInput } from '@/lib/validations/early-access.schema';

const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/hiretivo/',
  twitter: 'https://x.com/hiretivo',
  instagram: 'https://www.instagram.com/hire.tivo/',
} as const;

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'primary' | 'light' | 'white';
}

function FeatureCard({ icon, title, description, variant }: FeatureCardProps) {
  const variantClasses = {
    primary: 'bg-brand-primary text-white relative overflow-hidden group',
    light: 'bg-gray-50 hover:bg-gray-200 border border-gray-200',
    white: 'bg-white border border-gray-200 hover:-translate-y-1',
  };

  const iconBgClasses = {
    primary: 'bg-white/20',
    light: 'bg-gray-50',
    white: 'bg-gray-50',
  };

  const iconColorClasses = {
    primary: 'text-white',
    light: 'text-brand-primary',
    white: 'text-brand-primary',
  };

  return (
    <div className={cn('p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-300', variantClasses[variant])}>
      {variant === 'primary' && (
        <div className="absolute top-10 right-10 opacity-20 transform group-hover:scale-110 transition-transform duration-700">
          <span className="material-symbols-outlined text-[160px]">auto_awesome</span>
        </div>
      )}
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center mb-6', iconBgClasses[variant])}>
        <span className={cn('material-symbols-outlined text-2xl', iconColorClasses[variant])}>{icon}</span>
      </div>
      <div className="relative z-10">
        <h3 className="font-bold text-xl md:text-2xl mb-3 text-inherit">{title}</h3>
        <p className="text-sm md:text-base leading-relaxed opacity-90">{description}</p>
      </div>
    </div>
  );
}

export function ComingSoonPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EarlyAccessInput>({
    resolver: zodResolver(earlyAccessSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: EarlyAccessInput) => {
    window.location.href = `mailto:admin@hiretivo.com?subject=Early access request&body=${encodeURIComponent(data.email)}`;
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gray-50/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-gray-50/80 blur-[100px]" />
      </div>

      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/80">
        <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" />
          </Link>
        </nav>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <section className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 text-black text-xs font-semibold tracking-widest uppercase mb-8">
            <Rocket className="w-4 h-4" />
            Launching Soon
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-foreground mb-4 leading-none">
            Coming <span className="text-black italic">Soon</span>
          </h1>

          <p className="text-2xl md:text-4xl text-muted-foreground font-medium tracking-tight mb-12">
            Hiring, but smarter.
          </p>

          <div className="w-full max-w-lg mx-auto space-y-4">
            {isSuccess ? (
              <div className="p-8 bg-white rounded-xl text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Thanks!</h3>
                <p className="text-muted-foreground">We&apos;ll notify you when we launch.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-xl md:rounded-full"
              >
                <div className="flex-grow relative">
                  <input
                    type="email"
                    placeholder="Enter your work email"
                    {...register('email')}
                    className={cn(
                      'w-full px-8 py-4 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-gray-400 focus:outline-none rounded-xl md:rounded-full',
                      errors.email && 'text-red-500'
                    )}
                  />
                  {errors.email && (
                    <p className="absolute left-8 top-full mt-1 text-xs text-red-500 text-left">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="px-10 py-4 bg-brand-primary text-white font-bold rounded-xl md:rounded-full hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                >
                  {isSubmitting ? 'Submitting...' : 'Get Early Access'}
                </button>
              </form>
            )}
            <p className="text-sm text-muted-foreground">Join 2,000+ companies waiting for smarter hiring.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-6 grid-rows-none md:grid-rows-2 gap-6 h-auto md:h-[600px]">
          <div className="md:col-span-4 md:row-span-2">
            <FeatureCard
              icon={<span className="material-symbols-outlined text-2xl">auto_awesome</span>}
              title="AI Filtering"
              description="Stop scanning resumes. Our advanced algorithms match candidates based on culture fit and technical depth, delivering the top 1% directly to your inbox."
              variant="primary"
            />
          </div>
          <div className="md:col-span-2 md:row-span-1">
            <FeatureCard
              icon={<span className="material-symbols-outlined text-2xl">speed</span>}
              title="Rapid Sourcing"
              description="Reduce time-to-hire by 60% with our pre-vetted elite network."
              variant="light"
            />
          </div>
          <div className="md:col-span-2 md:row-span-1">
            <FeatureCard
              icon={<span className="material-symbols-outlined text-2xl">verified_user</span>}
              title="Verified Talent"
              description="Rigorous multi-step assessment process ensuring only the best."
              variant="white"
            />
          </div>
        </section>
      </main>

      <footer className="w-full py-16 bg-transparent border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-gray-400 text-xs tracking-widest uppercase">© 2024 Hiretivo Inc.</span>
          </div>
          <div className="flex gap-4">
            <Link
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center text-muted-foreground hover:text-black hover:bg-gray-100 transition-all"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center text-muted-foreground hover:text-black hover:bg-gray-100 transition-all"
            >
              <Twitter className="w-5 h-5" />
            </Link>
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center text-muted-foreground hover:text-black hover:bg-gray-100 transition-all"
            >
              <Instagram className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
