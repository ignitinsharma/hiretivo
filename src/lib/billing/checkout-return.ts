const ALLOWED_CHECKOUT_RETURN_PREFIXES = [
  "/recruiter/talent",
  "/recruiter/dashboard",
] as const;

function hasAllowedPathBoundary(path: string, prefix: string): boolean {
  const nextCharacter = path[prefix.length];
  return (
    path === prefix ||
    nextCharacter === "/" ||
    nextCharacter === "?" ||
    nextCharacter === "#"
  );
}

export function isAllowedCheckoutReturnTo(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return false;
  }

  return ALLOWED_CHECKOUT_RETURN_PREFIXES.some((prefix) =>
    value.startsWith(prefix) && hasAllowedPathBoundary(value, prefix),
  );
}
