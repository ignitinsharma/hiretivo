'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ApplicationListSkeleton() {
  return (
    <div>
      <div className="mb-10 flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
