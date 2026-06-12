/*
 * File signature ("magic byte") validation.
 *
 * The client-claimed Content-Type on an upload is trivially spoofed (a renamed
 * executable can be sent as image/png). These helpers inspect the actual leading
 * bytes of the uploaded buffer to confirm the real file type server-side.
 */

export type UploadKind = "image" | "document";

/*
 * detectMimeFromBytes
 * Sniffs the leading bytes of a buffer to determine its true type.
 * @param b - File bytes
 * @returns canonical MIME string, or null if unrecognized
 */
export function detectMimeFromBytes(b: Uint8Array): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  // PDF: "%PDF-"
  if (
    b.length >= 5 &&
    b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d
  ) {
    return "application/pdf";
  }
  // Legacy .doc (OLE2 compound document): D0 CF 11 E0 A1 B1 1A E1
  if (
    b.length >= 8 &&
    b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 &&
    b[4] === 0xa1 && b[5] === 0xb1 && b[6] === 0x1a && b[7] === 0xe1
  ) {
    return "application/msword";
  }
  // ZIP container (covers .docx / OpenXML): "PK" 03 04 / 05 06 / 07 08
  if (
    b.length >= 4 &&
    b[0] === 0x50 && b[1] === 0x4b &&
    (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) &&
    (b[3] === 0x04 || b[3] === 0x06 || b[3] === 0x08)
  ) {
    return "application/zip";
  }
  return null;
}

const IMAGE_SIGNATURES = ["image/png", "image/jpeg", "image/webp"];
// .docx is an OpenXML (zip) container, so a zip signature is the strongest
// server-side guarantee available without unzipping.
const DOCUMENT_SIGNATURES = ["application/pdf", "application/msword", "application/zip"];

/*
 * sniffedTypeAllowed
 * Confirms the buffer's real type matches the expected upload kind.
 * @param buf - File bytes
 * @param kind - "image" (png/jpeg/webp) or "document" (pdf/doc/docx)
 * @returns true if the sniffed type is allowed
 */
export function sniffedTypeAllowed(buf: Uint8Array, kind: UploadKind): boolean {
  const detected = detectMimeFromBytes(buf);
  if (!detected) return false;
  return kind === "image"
    ? IMAGE_SIGNATURES.includes(detected)
    : DOCUMENT_SIGNATURES.includes(detected);
}
