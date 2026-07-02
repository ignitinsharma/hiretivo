import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeTemplate } from "@/lib/resume/template/ResumeTemplate";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

/*
 * renderResumePdf
 * Renders a ResumeDocument to an ATS-safe PDF Buffer. Pure: no I/O, no Prisma,
 * no request context — deterministic output for a given input. Callers (Phase 5
 * wizard, this phase's smoke script) upload the buffer via storeResumePdf().
 * Uses @react-pdf/renderer's renderToBuffer so it runs in Node (route handler /
 * server action / script) with no browser or R2 needed.
 * @param doc - fully assembled, typed ResumeDocument
 * @returns Promise<Buffer> — a valid single-page PDF with real selectable text
 */
export async function renderResumePdf(doc: ResumeDocument): Promise<Buffer> {
  return renderToBuffer(<ResumeTemplate doc={doc} />);
}
