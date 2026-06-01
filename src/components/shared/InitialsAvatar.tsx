'use client';

import { useEffect, useState } from 'react';

import { getAvatarImageUrl, getDiceBearAvatarUrl } from '@/lib/avatar';
import { getInitials } from '@/lib/initials';
import { cn } from '@/lib/utils';

interface InitialsAvatarProps {
  name?: string | null;
  companyName?: string | null;
  email?: string | null;
  userId?: string | null;
  fallbackSeed?: string | null;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<InitialsAvatarProps['size']>, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-2xl',
};

const SIZE_PIXELS: Record<NonNullable<InitialsAvatarProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 96,
};

export function InitialsAvatar({
  name,
  companyName,
  email,
  userId,
  fallbackSeed,
  image,
  size = 'md',
  className,
}: InitialsAvatarProps) {
  const [uploadedImageFailed, setUploadedImageFailed] = useState(false);
  const [fallbackImageFailed, setFallbackImageFailed] = useState(false);
  const initials = getInitials({ name, companyName });
  const px = SIZE_PIXELS[size];
  const label = companyName ?? name ?? 'Avatar';
  const uploadedImageUrl = getAvatarImageUrl(image);
  const fallbackImageUrl = getDiceBearAvatarUrl({
    userId,
    email,
    name,
    companyName,
    fallbackSeed,
  });

  useEffect(() => {
    setUploadedImageFailed(false);
  }, [uploadedImageUrl]);

  useEffect(() => {
    setFallbackImageFailed(false);
  }, [fallbackImageUrl]);

  if (uploadedImageUrl && !uploadedImageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={uploadedImageUrl}
        alt={label}
        width={px}
        height={px}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
        onError={() => setUploadedImageFailed(true)}
      />
    );
  }

  if (!fallbackImageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackImageUrl}
        alt={label}
        width={px}
        height={px}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
        onError={() => setFallbackImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full bg-gray-100 font-semibold text-black',
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={label}
    >
      {initials}
    </span>
  );
}
