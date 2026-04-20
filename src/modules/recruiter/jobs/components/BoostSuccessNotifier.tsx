'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function BoostSuccessNotifier() {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get('boost') === 'success') {
      toast.success('Boost payment received! Your job will be pinned within a few minutes.');
    }
  }, [params]);
  return null;
}
