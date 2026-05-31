'use client';

import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Upload, Camera, Globe, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CompanySize, Industry, FundingType } from '@/lib/validations/recruiter-onboarding.schema';
import { useOnboardingStore } from '@/store/use-recruiter-onboarding-store';
import { saveRecruiterProfile } from '@/app/actions/onboarding/recruiter';
import { useSession } from 'next-auth/react';
import { SUPPORT_URL } from '@/lib/config';
import Link from 'next/link';

interface StepCompanyProfileProps {
  onNext: () => void;
  onBack: () => void;
}

type FieldErrors = {
  companyName?: string;
  website?: string;
  companySize?: string;
  industry?: string;
  fundingType?: string;
};

const companySizeOptions: { value: CompanySize; label: string }[] = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
];

const industryOptions: { value: Industry; label: string }[] = [
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'EDUCATION', label: 'Education' },
];

const fundingTypeOptions: { value: FundingType; label: string }[] = [
  { value: 'BOOTSTRAPPED', label: 'Bootstrapped' },
  { value: 'PRE_SEED', label: 'Pre-seed' },
  { value: 'SEED', label: 'Seed' },
  { value: 'SERIES_A', label: 'Series A' },
  { value: 'SERIES_B', label: 'Series B' },
  { value: 'SERIES_C', label: 'Series C' },
  { value: 'SERIES_C_PLUS', label: 'Series C+' },
  { value: 'PUBLICLY_TRADED', label: 'Publicly Traded' },
];

/*
 * StepCompanyProfile
 * Onboarding step 2: collect company name, website, size, industry, funding type, remote flag, logo.
 * Validates all required fields client-side (including URL auto-prepend) before hitting the server action.
 */
export function StepCompanyProfile({ onNext, onBack }: StepCompanyProfileProps) {
  const { step2, setCompanyName, setCompanyWebsite, setCompanySize, setIndustry, setFundingType, setIsFullyRemote, setLogoUrl } = useOnboardingStore();
  const [logoPreview, setLogoPreview] = useState<string | null>(step2.logoUrl);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiError(null);
  };

  const validateStep = (): boolean => {
    const errs: FieldErrors = {};

    if (!step2.companyName.trim()) {
      errs.companyName = 'Company name is required';
    }

    if (step2.companyWebsite) {
      let url = step2.companyWebsite.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        setCompanyWebsite(url);
      }
      try {
        new URL(url);
      } catch {
        errs.website = 'Enter a valid URL (e.g. https://acme.com)';
      }
    }

    if (!step2.companySize) errs.companySize = 'Select company size';
    if (!step2.industry) errs.industry = 'Select industry';
    if (!step2.fundingType) errs.fundingType = 'Select funding type';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (isSaving) return;
    if (!validateStep()) return;

    setIsSaving(true);
    setApiError(null);
    const result = await saveRecruiterProfile({
      companyName: step2.companyName,
      website: step2.companyWebsite || null,
      companySize: step2.companySize,
      bio: null,
      industry: step2.industry,
      fundingType: step2.fundingType,
      isFullyRemote: step2.isFullyRemote,
      logo: step2.logoUrl,
    });

    if (!result.success) {
      console.error('[StepCompanyProfile] saveRecruiterProfile failed:', result.error);
      setApiError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onNext();
  };

  const OptionButton = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:border-primary/50 text-foreground'
      )}
    >
      {selected && <Check className="w-4 h-4 mr-1" />}
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Set up your company profile</h2>
          <p className="text-muted-foreground">This appears on your job listings and company page.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors overflow-hidden group"
            >
              {logoPreview ? (
                <>
                  <Image src={logoPreview} alt="Company logo" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <p className="text-sm text-muted-foreground mt-2">Upload company logo</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Name</label>
              <Input
                placeholder="Acme Inc."
                value={step2.companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  clearFieldError('companyName');
                }}
                className={cn(fieldErrors.companyName && 'border-destructive focus-visible:ring-destructive')}
              />
              {fieldErrors.companyName && (
                <p className="text-sm text-destructive">{fieldErrors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Company Website
              </label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={step2.companyWebsite}
                onChange={(e) => {
                  setCompanyWebsite(e.target.value);
                  clearFieldError('website');
                }}
                className={cn(fieldErrors.website && 'border-destructive focus-visible:ring-destructive')}
              />
              {fieldErrors.website && (
                <p className="text-sm text-destructive">{fieldErrors.website}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Size</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {companySizeOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    selected={step2.companySize === option.value}
                    onClick={() => {
                      setCompanySize(option.value);
                      clearFieldError('companySize');
                    }}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
              {fieldErrors.companySize && (
                <p className="text-sm text-destructive">{fieldErrors.companySize}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Industry</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {industryOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    selected={step2.industry === option.value}
                    onClick={() => {
                      setIndustry(option.value);
                      clearFieldError('industry');
                    }}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
              {fieldErrors.industry && (
                <p className="text-sm text-destructive">{fieldErrors.industry}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Funding Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {fundingTypeOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    selected={step2.fundingType === option.value}
                    onClick={() => {
                      setFundingType(option.value);
                      clearFieldError('fundingType');
                    }}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
              {fieldErrors.fundingType && (
                <p className="text-sm text-destructive">{fieldErrors.fundingType}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={step2.isFullyRemote}
                  onChange={(e) => setIsFullyRemote(e.target.checked)}
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Fully remote team?</span>
                  <p className="text-sm text-muted-foreground">Our team has no physical office</p>
                </div>
              </label>
            </div>

            {apiError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{apiError}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleContinue}
              size="lg"
              variant="primary"
              className="w-full"
              loading={isSaving}
              loadingText="Saving..."
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need help?{' '}
          <Link href={SUPPORT_URL} className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
