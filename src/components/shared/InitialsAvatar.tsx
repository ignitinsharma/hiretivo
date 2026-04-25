import Image from 'next/image';

import { getInitials } from '@/lib/initials';
import { cn } from '@/lib/utils';

interface InitialsAvatarProps {
  name?: string | null;
  companyName?: string | null;
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
  image,
  size = 'md',
  className,
}: InitialsAvatarProps) {
  const initials = getInitials({ name, companyName });
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

  return (
    <span
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full bg-[rgba(89,82,229,0.1)] font-semibold text-[#5952e5]',
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={label}
    >
      {initials}
    </span>
  );
}
