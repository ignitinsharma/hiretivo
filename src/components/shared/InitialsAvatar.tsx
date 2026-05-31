import Image from 'next/image';

import { getDiceBearUrl } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface InitialsAvatarProps {
  name?: string | null;
  companyName?: string | null;
  image?: string | null;
  email?: string | null;
  userId?: string | null;
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

/*
 * InitialsAvatar
 * Renders a user avatar. Shows real photo when image is set, otherwise falls
 * back to a unique DiceBear illustrated face seeded by email > name > userId.
 */
export function InitialsAvatar({
  name,
  companyName,
  image,
  email,
  userId,
  size = 'md',
  className,
}: InitialsAvatarProps) {
  const px = SIZE_PIXELS[size];
  const label = companyName ?? name ?? 'Avatar';

  if (image) {
    return (
      <Image
        src={image}
        alt={label}
        width={px}
        height={px}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    );
  }

  const seed = email ?? name ?? companyName ?? userId ?? 'default';
  return (
    <Image
      src={getDiceBearUrl(seed)}
      alt={label}
      width={px}
      height={px}
      unoptimized
      className={cn('rounded-full', SIZE_CLASSES[size], className)}
    />
  );
}
