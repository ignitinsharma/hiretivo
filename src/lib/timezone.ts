/** Pure timezone utilities — no external dependencies, uses native Intl API. */

export interface TimezoneOption {
  value: string;
  label: string;
}

export interface InterviewTimezoneDisplay {
  scheduled: string;
  viewer: string;
  scheduledTimezone: string;
  viewerTimezone: string;
  isSameTimezone: boolean;
}

const PREFERRED_TIMEZONE_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
};

/** Returns the browser's IANA timezone string, falling back to "UTC". */
export function detectBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimezone(tz) ? normalizeTimezone(tz) : "UTC";
  } catch {
    return "UTC";
  }
}

/** Converts supported legacy timezone aliases to the preferred name used in the UI. */
export function normalizeTimezone(timezone: string): string {
  return PREFERRED_TIMEZONE_ALIASES[timezone] ?? timezone;
}

/** Returns true for IANA timezones supported by Intl, plus UTC. */
export function isValidTimezone(timezone: string | null | undefined): boolean {
  if (!timezone) return false;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Returns all runtime-supported IANA timezones, with UTC added explicitly. */
export function getAllTimezones(): readonly string[] {
  try {
    const zones = Intl.supportedValuesOf("timeZone");
    return zones.includes("UTC") ? zones : ["UTC", ...zones];
  } catch {
    return COMMON_TIMEZONES.map((timezone) => timezone.value);
  }
}

function safeTimezone(timezone: string | null | undefined): string {
  return timezone && isValidTimezone(timezone) ? normalizeTimezone(timezone) : "UTC";
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
  const safeInputTimezone = safeTimezone(timezone);
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
    const projected = getTimezoneParts(new Date(utcMs), safeInputTimezone);
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
  return new Intl.DateTimeFormat("en-US", {
    ...style,
    timeZone: safeTimezone(timezone),
  }).format(date);
}

/** Formats only the date portion (e.g. "Jan 5") in the given timezone. */
export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimezone(timezone),
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Formats only the time portion with timezone abbreviation (e.g. "2:30 PM IST") in the given timezone. */
export function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimezone(timezone),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

export function formatInterviewTimezoneDisplay(
  date: Date,
  scheduledTimezone: string | null | undefined,
  viewerTimezone: string | null | undefined,
): InterviewTimezoneDisplay {
  const safeScheduledTimezone = safeTimezone(scheduledTimezone);
  const safeViewerTimezone = safeTimezone(viewerTimezone);

  return {
    scheduled: `${formatInTimezone(date, safeScheduledTimezone, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} (${safeScheduledTimezone})`,
    viewer: `${formatInTimezone(date, safeViewerTimezone, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} (${safeViewerTimezone})`,
    scheduledTimezone: safeScheduledTimezone,
    viewerTimezone: safeViewerTimezone,
    isSameTimezone: safeScheduledTimezone === safeViewerTimezone,
  };
}

export function getCalendarDateInTimezone(date: Date, timezone: string | null | undefined): Date {
  const parts = getTimezoneParts(date, safeTimezone(timezone));
  return new Date(parts.year, parts.month - 1, parts.day);
}

/** Common IANA timezones for the timezone selector dropdown. */
export const COMMON_TIMEZONES: ReadonlyArray<TimezoneOption> =
  [
    { value: "Pacific/Honolulu", label: "Honolulu (HST)" },
    { value: "America/Anchorage", label: "Anchorage (AKT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
    { value: "America/Vancouver", label: "Vancouver (PT)" },
    { value: "America/Denver", label: "Denver (MT)" },
    { value: "America/Chicago", label: "Chicago (CT)" },
    { value: "America/New_York", label: "New York (ET)" },
    { value: "America/Toronto", label: "Toronto (ET)" },
    { value: "America/Mexico_City", label: "Mexico City (CT)" },
    { value: "America/Panama", label: "Panama (EST)" },
    { value: "America/Lima", label: "Lima (PET)" },
    { value: "America/Sao_Paulo", label: "Sao Paulo (BRT)" },
    { value: "America/Buenos_Aires", label: "Buenos Aires (ART)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Dublin", label: "Dublin (GMT/IST)" },
    { value: "Europe/Lisbon", label: "Lisbon (WET/WEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
    { value: "Europe/Rome", label: "Rome (CET/CEST)" },
    { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
    { value: "Europe/Zurich", label: "Zurich (CET/CEST)" },
    { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)" },
    { value: "Europe/Warsaw", label: "Warsaw (CET/CEST)" },
    { value: "Europe/Athens", label: "Athens (EET/EEST)" },
    { value: "Europe/Helsinki", label: "Helsinki (EET/EEST)" },
    { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
    { value: "Europe/Moscow", label: "Moscow (MSK)" },
    { value: "Africa/Cairo", label: "Cairo (EET)" },
    { value: "Africa/Lagos", label: "Lagos (WAT)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
    { value: "Asia/Jerusalem", label: "Jerusalem (IST/IDT)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Riyadh", label: "Riyadh (AST)" },
    { value: "Asia/Karachi", label: "Karachi (PKT)" },
    { value: "Asia/Kolkata", label: "Kolkata (IST)" },
    { value: "Asia/Kathmandu", label: "Kathmandu (NPT)" },
    { value: "Asia/Dhaka", label: "Dhaka (BST)" },
    { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
    { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Taipei", label: "Taipei (CST)" },
    { value: "Asia/Seoul", label: "Seoul (KST)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Manila", label: "Manila (PHT)" },
    { value: "Australia/Perth", label: "Perth (AWST)" },
    { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
    { value: "Australia/Sydney", label: "Sydney (AET)" },
    { value: "Pacific/Auckland", label: "Auckland (NZT)" },
    { value: "UTC", label: "UTC" },
  ] as const;
