import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const API_ROOT = path.join(process.cwd(), "src/app/api");
const HTTP_METHOD_PATTERN =
  /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;

const EXCLUDED_ROUTE_PARTS = [
  `${path.sep}cron${path.sep}`,
];

/*
 * collectRouteFiles
 * Recursively finds Next.js API route files below a directory.
 * Returns absolute paths to each route.ts file.
 */
function collectRouteFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
      continue;
    }

    if (entry === "route.ts") {
      files.push(fullPath);
    }
  }

  return files;
}

/*
 * isExcludedRoute
 * Checks whether an API route should be ignored by the limiter audit.
 * Returns true for internal cron routes.
 */
function isExcludedRoute(filePath: string): boolean {
  return EXCLUDED_ROUTE_PARTS.some((routePart) => filePath.includes(routePart));
}

/*
 * getExportedMethods
 * Reads a route source file and extracts exported HTTP handler names.
 * Returns sorted method names such as GET, POST, PATCH, or DELETE.
 */
function getExportedMethods(source: string): string[] {
  const methods = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = HTTP_METHOD_PATTERN.exec(source)) !== null) {
    methods.add(match[1]);
  }

  return Array.from(methods).sort();
}

/*
 * hasRateLimit
 * Detects whether a route file invokes a rate limiter.
 * Returns true when the file contains a `.limit(` call.
 */
function hasRateLimit(source: string): boolean {
  return source.includes(".limit(");
}

const routeFiles = collectRouteFiles(API_ROOT);
const unprotectedRoutes: string[] = [];

for (const filePath of routeFiles) {
  if (isExcludedRoute(filePath)) {
    continue;
  }

  const source = readFileSync(filePath, "utf8");
  const methods = getExportedMethods(source);

  if (methods.length === 0) {
    continue;
  }

  if (!hasRateLimit(source)) {
    const relativePath = path.relative(process.cwd(), filePath);
    unprotectedRoutes.push(`${relativePath}: ${methods.join(", ")}`);
  }
}

if (unprotectedRoutes.length > 0) {
  console.error("API route files without rate limiting:");
  for (const route of unprotectedRoutes) {
    console.error(`- ${route}`);
  }
  process.exit(1);
}

console.log("All non-cron API route files with exported handlers include rate limiting.");
