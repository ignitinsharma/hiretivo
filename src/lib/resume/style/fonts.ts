// Font registration for resume rendering.
// Built-in react-pdf fonts (Times, Helvetica) map directly.
// Additional font families (Calibri, Georgia, Garamond, Cambria) use
// open-licensed metric-compatible substitutes bundled in public/fonts/.
// Every Font.register call is wrapped in try/catch — on failure,
// falls back to built-in Helvetica (sans-serif) or Times (serif).

import { Font } from "@react-pdf/renderer";
import { type z } from "zod";
import type { FontFamilyEnum } from "@/lib/validations/resume-style.schema";

// which built-in react-pdf fonts we use
// Times-Roman → times_new_roman
// Helvetica → helvetica, arial
// For other families, we register TTF files from /fonts/

const registered = new Set<string>();
const failed = new Set<string>();

function safeRegister(family: string, options: Parameters<typeof Font.register>[0]) {
  try {
    Font.register(options);
    registered.add(family);
  } catch (err) {
    failed.add(family);
  }
}

// Built-in fonts — pre-registered in react-pdf, no file needed.
// We just track them as "registered" for the getRegisteredFonts() helper.
registered.add("times_new_roman");
registered.add("helvetica");
registered.add("arial");

// Additional font families with metric-compatible substitutes.
// Files must be placed in public/fonts/ before these registrations work.
// Carlito ≈ Calibri, Gelasio ≈ Georgia, EB Garamond ≈ Garamond, Caladea ≈ Cambria.
// All SIL OFL — free for redistribution.

safeRegister("calibri", {
  family: "Carlito",
  fonts: [
    { src: "/fonts/Carlito-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Carlito-Bold.ttf", fontWeight: 700 },
  ],
});

safeRegister("georgia", {
  family: "Gelasio",
  fonts: [
    { src: "/fonts/Gelasio-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Gelasio-Bold.ttf", fontWeight: 700 },
  ],
});

safeRegister("garamond", {
  family: "EB Garamond",
  fonts: [
    { src: "/fonts/EBGaramond-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/EBGaramond-Bold.ttf", fontWeight: 700 },
  ],
});

safeRegister("cambria", {
  family: "Caladea",
  fonts: [
    { src: "/fonts/Caladea-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Caladea-Bold.ttf", fontWeight: 700 },
  ],
});

/** Maps our FontFamilyEnum values to the actual react-pdf font family name. */
export function getPdfFamily(fontFamily: z.infer<typeof FontFamilyEnum>): string {
  switch (fontFamily) {
    case "times_new_roman":
      return "Times-Roman";
    case "arial":
    case "helvetica":
      return "Helvetica";
    case "calibri":
      return "Carlito";
    case "georgia":
      return "Gelasio";
    case "garamond":
      return "EB Garamond";
    case "cambria":
      return "Caladea";
  }
}

/** Returns the set of successfully-registered font family enum values. */
export function getRegisteredFonts(): Set<string> {
  return new Set(registered);
}

/** Returns which font families failed to register. */
export function getFailedFonts(): Set<string> {
  return new Set(failed);
}
