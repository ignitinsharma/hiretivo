export const AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATELY', label: 'Immediate / No notice period' },
  { value: 'LESS_THAN_15_DAYS', label: 'Less than 15 days' },
  { value: '15_DAYS', label: '15 days' },
  { value: '30_DAYS', label: '30 days' },
  { value: '45_DAYS', label: '45 days' },
  { value: '60_DAYS', label: '60 days' },
  { value: '90_DAYS', label: '90 days' },
  { value: 'SERVING_NOTICE', label: 'Serving notice period' },
] as const;

export function formatAvailabilityLabel(value: string | null | undefined): string {
  if (!value) return 'Not specified';
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
