import "./pdfjs-dommatrix-polyfill";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_TEXT_CHARS = 40_000;

/*
 * extractPdfText
 * Extracts plain text from a PDF buffer for cheap text-based LLM parsing.
 * @param pdfBuffer - raw PDF bytes
 * @returns extracted text (up to MAX_TEXT_CHARS), or "" when the PDF is
 *   scanned/image-based or extraction fails (caller falls back to vision).
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const task = getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdf = await task.promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ("str" in item ? String(item.str) : ""))
        .join(" ");
      parts.push(line);
      if (parts.join("\n").length > MAX_TEXT_CHARS) break;
    }
    await task.destroy();
    return parts.join("\n").trim();
  } catch (err) {
    console.error("[pdf-text-extract] extraction failed:", err instanceof Error ? err.message : err);
    return "";
  }
}
