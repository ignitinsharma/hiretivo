'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useFeedFilters } from '@/modules/seeker/feed/hooks/use-feed-filters';
import {
  WORKPLACE_OPTIONS,
  LOCATION_OPTIONS,
  EMPLOYMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
} from '@/modules/seeker/feed/constants/filter-options';

interface FeedFilterBarProps {
  companies: string[];
}

const SELECT_FILTERS = [
  { key: 'workType' as const, label: 'Workplace', placeholder: 'Any workplace', options: WORKPLACE_OPTIONS },
  { key: 'locationClass' as const, label: 'Location', placeholder: 'Any location', options: LOCATION_OPTIONS },
  { key: 'employmentType' as const, label: 'Employment type', placeholder: 'Any type', options: EMPLOYMENT_OPTIONS },
  { key: 'experienceMax' as const, label: 'Max experience', placeholder: 'Any level', options: EXPERIENCE_OPTIONS },
];

/* FeedFilterBar
 * Filter controls for the match-ranked feed: search, workplace, location, employment type,
 * max experience, company multiselect, sponsors-visa toggle, role text, and clear-all.
 * Filter state is URL-synced via useFeedFilters. Collapses into a Sheet on mobile.
 * @param companies - distinct company names for the companies multiselect */
export function FeedFilterBar({ companies }: FeedFilterBarProps) {
  const { filters, setFilter, clearFilters, activeCount } = useFeedFilters();
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== (filters.search ?? '')) setFilter('search', searchInput || undefined);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const toggleCompany = (company: string) => {
    const current = filters.companies ?? [];
    const next = current.includes(company)
      ? current.filter((c) => c !== company)
      : [...current, company];
    setFilter('companies', next.length ? next : undefined);
  };

  const controls = (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <Input
        aria-label="Search title or description"
        placeholder="Search title or description"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full lg:w-56"
      />
      {SELECT_FILTERS.map((f) => (
        <Select
          key={f.key}
          value={(filters[f.key] as string) ?? ''}
          onValueChange={(v) => setFilter(f.key, (v || undefined) as never)}
        >
          <SelectTrigger aria-label={f.label} className="w-full lg:w-40">
            <SelectValue placeholder={f.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" aria-label="Filter by company" className="w-full justify-start lg:w-40">
            Companies{filters.companies?.length ? ` (${filters.companies.length})` : ''}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-64 overflow-y-auto p-2">
          {companies.length === 0 && (
            <p className="p-2 text-sm text-brand-foreground-muted">No companies yet</p>
          )}
          {companies.map((company) => (
            <label key={company} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-brand-surface">
              <Checkbox
                checked={filters.companies?.includes(company) ?? false}
                onCheckedChange={() => toggleCompany(company)}
                aria-label={company}
              />
              {company}
            </label>
          ))}
        </PopoverContent>
      </Popover>
      <Input
        aria-label="Role"
        placeholder="Role (e.g. Frontend)"
        value={filters.role ?? ''}
        onChange={(e) => setFilter('role', e.target.value || undefined)}
        className="w-full lg:w-40"
      />
      <label className="flex items-center gap-2 text-sm text-brand-foreground-muted">
        <Switch
          checked={filters.visaSponsored ?? false}
          onCheckedChange={(checked) => setFilter('visaSponsored', checked || undefined)}
          aria-label="Sponsors visa"
        />
        Sponsors visa
      </label>
      {activeCount > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="w-full lg:w-auto">
          Clear all ({activeCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="hidden lg:block">{controls}</div>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" className="w-full justify-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && <Badge>{activeCount}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter jobs</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{controls}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
