import { BOUNDS } from "@/lib/validations/resume-style.schema";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

/* NB — @react-pdf/renderer, pdf-lib, and layout-tree are dynamically
 * imported inside renderPageCount to keep them out of SSR module graphs
 * (they need browser APIs / depend on react-pdf JSX). */

const LEVER_ORDER = [
  "sectionSpacing",
  "entrySpacing",
  "margin",
  "lineSpacing",
] as const;

const FONT_LEVER_ORDER = ["bodyText", "subHeaders", "sectionHeaders", "name"] as const;

const MAX_ITERATIONS = 8;

interface FitResult {
  config: ResumeStyleConfig;
  overflow: boolean;
}

/*
 * renderPageCount — renders the resume doc with the given config to a blob
 * and returns the page count via pdf-lib. Returns null on render failure
 * (invalid config / font crash) so the fit loop can bail gracefully.
 */
async function renderPageCount(
  doc: ResumeDocument,
  config: ResumeStyleConfig,
): Promise<number | null> {
  try {
    const { pdf } = await import("@react-pdf/renderer");
    const { PDFDocument } = await import("pdf-lib");
    const { ResumeDocumentTree } = await import("./layout-tree");
    const blob = await pdf(
      ResumeDocumentTree({ doc, config, opts: {} }),
    ).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  } catch {
    return null;
  }
}

/*
 * fitToOnePage — shrinks spacing and font sizes within BOUNDS floors to fit
 * the resume on a single page. Decrements the largest-above-floor lever in
 * priority order (spacing first, then font sizes). Never truncates content.
 *
 * @param doc    - resume document to fit
 * @param config - style config to shrink from (mutated copy returned)
 * @returns { config: fitted config (may be unchanged), overflow: true if
 *           still exceeds one page after all levers are at floors }
 */
export async function fitToOnePage(
  doc: ResumeDocument,
  config: ResumeStyleConfig,
): Promise<FitResult> {
  const current = structuredClone(config);
  let pages = await renderPageCount(doc, current);
  if (pages === null) return { config: current, overflow: false };
  if (pages <= 1) return { config: current, overflow: false };

  let iterations = 0;

  while (pages > 1 && iterations < MAX_ITERATIONS) {
    let shrunk = false;

    // Try spacing levers first
    for (const key of LEVER_ORDER) {
      const bounds = BOUNDS.spacing[key as keyof typeof BOUNDS.spacing];
      const currentVal = current.spacing[key as keyof typeof current.spacing];
      if (currentVal > bounds.min) {
        current.spacing = {
          ...current.spacing,
          [key]: Math.max(bounds.min, currentVal - 1),
        };
        shrunk = true;
        break;
      }
    }

    // Then font levers
    if (!shrunk) {
      for (const key of FONT_LEVER_ORDER) {
        const bounds = BOUNDS.fontSize[key as keyof typeof BOUNDS.fontSize];
        const currentVal = current.fontSize[key as keyof typeof current.fontSize];
        if (currentVal > bounds.min) {
          current.fontSize = {
            ...current.fontSize,
            [key]: Math.max(bounds.min, currentVal - 0.5),
          };
          shrunk = true;
          break;
        }
      }
    }

    if (!shrunk) break; // all levers at floors

    const newPages = await renderPageCount(doc, current);
    if (newPages === null) break;
    pages = newPages;
    iterations++;
  }

  return { config: current, overflow: pages > 1 };
}
