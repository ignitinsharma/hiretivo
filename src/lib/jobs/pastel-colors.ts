/*
 * pastelColors
 * 5 reused pastel backgrounds for Tsenta-parity cards. index % 5 deterministic.
 */
export const PASTEL_COLORS = [
  "#E6F0FF", // blue
  "#E6FFF4", // mint
  "#F3E8FF", // lavender
  "#FFF9E6", // cream
  "#FFE6E6", // pink
] as const;

export function getPastelColor(index: number): string {
  return PASTEL_COLORS[index % PASTEL_COLORS.length];
}

export function getPastelClass(index: number): string {
  // Tailwind arbitrary bg via style prop preferred; this returns class for fallback
  const map = [
    "bg-[#E6F0FF]",
    "bg-[#E6FFF4]",
    "bg-[#F3E8FF]",
    "bg-[#FFF9E6]",
    "bg-[#FFE6E6]",
  ] as const;
  return map[index % map.length];
}
