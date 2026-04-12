'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function AuthRedirectToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get('authError');
    if (authError !== 'forbidden') return;

    toast.error('You do not have permissions to perform this action');

    const next = new URLSearchParams(searchParams.toString());
    next.delete('authError');
    const query = next.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
