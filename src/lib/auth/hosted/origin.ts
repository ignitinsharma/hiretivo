/** HTTP is permitted only on this computer while running the development server. */
export function isLocalDevelopmentOrigin(origin: string, runtime: string | undefined = process.env.NODE_ENV): boolean {
  if (runtime !== "development") return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/";
  } catch { return false; }
}
