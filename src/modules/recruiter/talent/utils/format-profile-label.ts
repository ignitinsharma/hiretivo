/**
 * Converts enum-style profile values into readable labels.
 */
export function formatProfileLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not specified";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
