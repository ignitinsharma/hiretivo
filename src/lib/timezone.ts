/** Pure timezone utilities — no external dependencies, uses native Intl API. */

/** Returns the browser's IANA timezone string, falling back to "UTC". */
export function detectBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.length > 0 ? tz : "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Builds a UTC Date from a local date + HH:MM time string in the given IANA timezone.
 * Iterates twice to account for DST offset shifts.
 */
export function buildUtcFromLocalTime(
  date: Date,
  timeHHMM: string,
  timezone: string,
): Date {
  const [hours, minutes] = timeHHMM.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time: ${timeHHMM}`);
  }
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + 1;
  const targetDay = date.getDate();
  let utcMs = Date.UTC(
    targetYear,
    targetMonth - 1,
    targetDay,
    hours,
    minutes,
    0,
    0,
  );
  for (let i = 0; i < 2; i++) {
    const projected = getTimezoneParts(new Date(utcMs), timezone);
    const projectedMs = Date.UTC(
      projected.year,
      projected.month - 1,
      projected.day,
      projected.hour,
      projected.minute,
      0,
      0,
    );
    const targetMs = Date.UTC(
      targetYear,
      targetMonth - 1,
      targetDay,
      hours,
      minutes,
      0,
      0,
    );
    const offsetMs = targetMs - projectedMs;
    if (offsetMs === 0) break;
    utcMs += offsetMs;
  }
  return new Date(utcMs);
}

interface TimezoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getTimezoneParts(date: Date, timezone: string): TimezoneParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") lookup[p.type] = p.value;
  }
  const hour = lookup.hour === "24" ? 0 : Number(lookup.hour);
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour,
    minute: Number(lookup.minute),
  };
}

/**
 * Formats a Date in the given IANA timezone using the provided Intl options.
 * Defaults to a full date+time+timezone-name format.
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  style: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  },
): string {
  return new Intl.DateTimeFormat("en-US", { ...style, timeZone: timezone }).format(date);
}

/** Formats only the date portion (e.g. "Jan 5") in the given timezone. */
export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Formats only the time portion with timezone abbreviation (e.g. "2:30 PM IST") in the given timezone. */
export function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

/** Common IANA timezones for the timezone selector dropdown. */
export const COMMON_TIMEZONES: ReadonlyArray<{ value: string; label: string }> =
  [
    { value: "Pacific/Honolulu", label: "Honolulu (HST)" },
    { value: "America/Anchorage", label: "Anchorage (AKT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
    { value: "America/Denver", label: "Denver (MT)" },
    { value: "America/Chicago", label: "Chicago (CT)" },
    { value: "America/New_York", label: "New York (ET)" },
    { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Kolkata", label: "Kolkata (IST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Australia/Sydney", label: "Sydney (AET)" },
    { value: "UTC", label: "UTC" },
  ] as const;
