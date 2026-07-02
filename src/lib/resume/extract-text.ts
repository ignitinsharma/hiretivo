import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import { ResumeMimeType } from "@/constants/enums";

/* Minimum extracted characters below which we treat a PDF as image-only (no text layer). */
const MIN_TEXT_LAYER_CHARS = 40;

export interface ResumeExtractResult {
  text: string;
  hasTextLayer: boolean;
}

/*
 * extractResumeText
 * Extracts plain text from a resume file buffer.
 * PDF → unpdf text layer; DOCX → mammoth raw text.
 * @param buffer - file bytes
 * @param mimeType - one of ResumeMimeType
 * @returns { text, hasTextLayer } — hasTextLayer=false signals a scanned/image PDF
 *          (or empty extraction) so callers can offer the manual-fill fallback.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string,
): Promise<ResumeExtractResult> {
  if (mimeType === ResumeMimeType.DOCX) {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = value.trim();
    return { text, hasTextLayer: text.length >= MIN_TEXT_LAYER_CHARS };
  }

  // PDF path
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
  return { text: merged, hasTextLayer: merged.length >= MIN_TEXT_LAYER_CHARS };
}
