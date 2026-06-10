'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Upload, Camera, Globe, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/image-compression';
import { LOGO_MAX_BYTES, LOGO_MIME_TYPES } from '@/lib/validations/upload.schema';
import { uploadService } from '@/services/upload.service';
import type { CompanySize, Industry, FundingType } from '@/lib/validations/recruiter-onboarding.schema';
import { useOnboardingStore } from '@/store/use-recruiter-onboarding-store';
import { saveRecruiterProfile } from '@/app/actions/onboarding/recruiter';
import { SUPPORT_URL } from '@/lib/config';
import Link from 'next/link';

interface StepCompanyProfileProps {
  onNext: () => void;
  onBack: () => void;
}

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

export function StepCompanyProfile({ onNext, onBack }: StepCompanyProfileProps) {
  const { step2, setCompanyName, setCompanyWebsite, setCompanySize, setIndustry, setFundingType, setIsFullyRemote, setLogoUrl } = useOnboardingStore();
  // Display URL: objectURL for a freshly-picked file, or /api/logo for an already-stored R2 key.
  // Guard against legacy base64 (data:) values that may linger in a persisted store.
  const [logoDisplayUrl, setLogoDisplayUrl] = useState<string | null>(() =>
    step2.logoUrl && !step2.logoUrl.startsWith('data:')
      ? `/api/logo?key=${encodeURIComponent(step2.logoUrl)}`
      : null,
  );
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Revoke any outstanding objectURL on unmount to avoid leaking blob memory.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const validateStep = (): boolean => {
    const newErrors: string[] = [];
    
    if (!step2.companyName.trim()) {
      newErrors.push('Company name is required');
    }
    if (!step2.companySize) {
      newErrors.push('Please select company size');
    }
    if (!step2.industry) {
      newErrors.push('Please select industry');
    }
    if (!step2.fundingType) {
      newErrors.push('Please select funding type');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  /*
   * handleLogoUpload
   * Validates type/size, compresses client-side, and holds the file for upload on Continue.
   * No network call here — the R2 upload is deferred until the RecruiterProfile row exists
   * (created by saveRecruiterProfile on Continue), since the upload route updates that row.
   * Preview uses a local objectURL for instant feedback.
   */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again re-triggers onChange.
    e.target.value = '';
    if (!file) return;

    setLogoUploadError(null);

    if (!LOGO_MIME_TYPES.includes(file.type as (typeof LOGO_MIME_TYPES)[number])) {
      setLogoUploadError('Use a PNG, JPEG, WebP, or SVG image');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoUploadError('File too large (max 2 MB)');
      return;
    }

    setIsProcessingLogo(true);
    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = previewUrl;
      setLogoDisplayUrl(previewUrl);
      setPendingLogoFile(compressed);
    } catch (error) {
      setLogoUploadError(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsProcessingLogo(false);
    }
  };

  /*
   * extractUploadError
   * Pulls the server's friendly message ({ error }) out of an axios error,
   * falling back to the error message or a generic string.
   */
  const extractUploadError = (error: unknown): string => {
    const data = (error as { response?: { data?: { error?: string } } })?.response?.data;
    if (data?.error) return data.error;
    if (error instanceof Error) return error.message;
    return 'Failed to upload logo';
  };

  /*
   * handleContinue
   * Validates, persists the profile (which creates the RecruiterProfile row), then uploads
   * the pending logo to R2 — in that order, because the upload route updates the now-existing
   * row. Advances only after both succeed.
   */
  const handleContinue = async () => {
    if (isSaving || isProcessingLogo) return;
    if (!validateStep()) return;

    // Persist to DB before advancing (per D-06)
    setIsSaving(true);
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
      console.error("[StepCompanyProfile] saveRecruiterProfile failed:", result.error);
      setErrors([result.error]);
      setIsSaving(false);
      return;
    }

    // Row now exists — upload the pending logo. Stay on this step if it fails (retry is idempotent).
    if (pendingLogoFile) {
      try {
        const upload = await uploadService.uploadCompanyLogo(pendingLogoFile);
        setLogoUrl(upload.key);
        setPendingLogoFile(null);
      } catch (error) {
        setLogoUploadError(extractUploadError(error));
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    onNext();
  };

  const OptionButton = ({ 
    selected, 
    onClick, 
    children 
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

  const getErrorMessage = () => {
    if (errors.includes('Company name is required')) return 'Company name is required';
    if (errors.includes('Please select company size')) return 'Please select company size';
    if (errors.includes('Please select industry')) return 'Please select industry';
    if (errors.includes('Please select funding type')) return 'Please select funding type';
    return null;
  };

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
              {logoDisplayUrl ? (
                <>
                  <Image
                    src={logoDisplayUrl}
                    alt="Company logo"
                    fill
                    unoptimized
                    className="object-cover"
                  />
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
              {isProcessingLogo && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground mt-2">Upload company logo</p>
            {logoUploadError && (
              <p className="text-sm text-destructive text-center mt-1">{logoUploadError}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Name</label>
              <Input
                placeholder="Acme Inc."
                value={step2.companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setErrors([]);
                }}
              />
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
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
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
                      setErrors([]);
                    }}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
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
                      setErrors([]);
                    }}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
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
                      setErrors([]);
                    }}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
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

            {getErrorMessage() && (
              <p className="text-sm text-destructive text-center">{getErrorMessage()}</p>
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
              disabled={isProcessingLogo || isSaving}
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
