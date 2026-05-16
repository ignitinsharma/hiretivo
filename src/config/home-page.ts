/*
 * TALENT_MARKETPLACE_STATS
 * Marketing proof numbers for the Hiretivo talent marketplace homepage.
 * Updated for Pivot v2: engineer-first, US/EU startup positioning.
 */
export const TALENT_MARKETPLACE_STATS = {
  verifiedEngineers: "500+",
  avgTimeToHire: "7 days",
  avgHiretivoScore: "78/100",
  usEuStartups: "120+",
} as const;

export const THREE_PILLARS = [
  {
    id: "verified",
    title: "Verified Before You See Them",
    description:
      "Every engineer passes GitHub review, live code assessment, and identity check before joining. You see Hiretivo Score — not resumes.",
    icon: "shield-check",
  },
  {
    id: "transparent",
    title: "Salary Transparency Both Ways",
    description:
      "Engineers post real USD salary expectations. You post real budget. No negotiation theater — just fit or no fit.",
    icon: "dollar-sign",
  },
  {
    id: "india-first",
    title: "India-First Identity",
    description:
      "Engineers stay in India. You get GMT+5:30 engineers who overlap 4–8h with your US/EU working hours. No relocation, no visa.",
    icon: "map-pin",
  },
] as const;