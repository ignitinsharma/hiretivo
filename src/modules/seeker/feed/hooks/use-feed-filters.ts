'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { feedFilterSchema } from '@/lib/validations/match';
import type { FeedFilters } from '@/modules/seeker/feed/types/feed.types';

/* useFeedFilters
 * Reads/writes seeker feed filter state to/from the URL query string so the feed is
 * shareable and back-button-safe. Validates the assembled filter object with
 * feedFilterSchema before returning (Zod on the client too).
 * @returns { filters, setFilter, clearFilters, activeCount } */
export function useFeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<FeedFilters>(() => {
    const raw = {
      search: searchParams.get('search') ?? undefined,
      workType: searchParams.get('workType') ?? undefined,
      locationClass: searchParams.get('locationClass') ?? undefined,
      companies: searchParams.get('companies') ?? undefined,
      experienceMax: searchParams.get('experienceMax') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      visaSponsored: searchParams.get('visaSponsored') ?? undefined,
      employmentType: searchParams.get('employmentType') ?? undefined,
    };
    const parsed = feedFilterSchema.safeParse(raw);
    if (!parsed.success) return {};
    const { companies, search, workType, locationClass, experienceMax, role, visaSponsored, employmentType } =
      parsed.data;
    return {
      ...(search ? { search } : {}),
      ...(workType ? { workType: workType as FeedFilters['workType'] } : {}),
      ...(locationClass ? { locationClass: locationClass as FeedFilters['locationClass'] } : {}),
      ...(companies?.length ? { companies } : {}),
      ...(experienceMax ? { experienceMax } : {}),
      ...(role ? { role } : {}),
      ...(visaSponsored ? { visaSponsored } : {}),
      ...(employmentType ? { employmentType: employmentType as FeedFilters['employmentType'] } : {}),
    };
  }, [searchParams]);

  const setFilter = useCallback(
    <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => {
      const params = new URLSearchParams(searchParams.toString());
      const isEmpty =
        value === undefined ||
        value === '' ||
        value === false ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const activeCount = Object.keys(filters).length;

  return { filters, setFilter, clearFilters, activeCount };
}
