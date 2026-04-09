const REQUIRED_TRACKING_PAIRS = [
  "ref=hiretivo",
  "utm_source=hiretivo",
  "utm_medium=job_board",
] as const;

export function appendHiretivoAttributionParams(url: string): string {
  const parsed = new URL(url);

  REQUIRED_TRACKING_PAIRS.forEach((pair) => {
    const [key, value] = pair.split("=");
    parsed.searchParams.set(key, value);
  });

  return parsed.toString();
}
