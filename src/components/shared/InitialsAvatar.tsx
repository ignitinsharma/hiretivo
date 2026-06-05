'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { HiretivoVerifiedBadge } from '@/components/shared/HiretivoVerifiedBadge';
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
  verified?: boolean;
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
  verified = false,
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

  const avatarClassName = cn(
    'rounded-full object-cover',
    SIZE_CLASSES[size],
    className,
    verified &&
      'border-2 border-brand-primary ring-2 ring-brand-primary/15 group-hover:border-brand-primary',
  );
  const fallbackClassName = cn(
    'inline-flex select-none items-center justify-center rounded-full bg-gray-100 font-semibold text-black',
    SIZE_CLASSES[size],
    className,
    verified &&
      'border-2 border-brand-primary ring-2 ring-brand-primary/15 group-hover:border-brand-primary',
  );

  let avatar: ReactElement;
  if (uploadedImageUrl && !uploadedImageFailed) {
    avatar = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={uploadedImageUrl}
        alt={label}
        width={px}
        height={px}
        className={avatarClassName}
        onError={() => setUploadedImageFailed(true)}
      />
    );
  } else if (!fallbackImageFailed) {
    avatar = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackImageUrl}
        alt={label}
        width={px}
        height={px}
        className={avatarClassName}
        onError={() => setFallbackImageFailed(true)}
      />
    );
  } else {
    avatar = (
      <span className={fallbackClassName} aria-label={label}>
        {initials}
      </span>
    );
  }

  if (!verified) return avatar;

  return (
    <span className="relative inline-flex shrink-0 rounded-full">
      {avatar}
      <HiretivoVerifiedBadge variant="avatar" size={size} />
    </span>
  );
}
