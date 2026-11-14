// The sidebar's collapsed state lives in a cookie so the server renders it
// correctly from the first paint. Read on the server and the client alike.

export const SIDEBAR_COOKIE = "hiretivo_sidebar";

/** Whether the sidebar was left collapsed. */
export function parseSidebarCollapsed(value: string | undefined): boolean {
  return value === "collapsed";
}

const YEAR_SECONDS = 365 * 24 * 60 * 60;

/** Remembers a preference for a year, from the browser. */
export function rememberPreference(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
}
