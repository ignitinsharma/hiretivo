import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ResumeDocumentTree } from "./layout-tree";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

/*
 * renderResumePdf
 * Renders a ResumeDocument to PDF using the same render tree as the
 * on-screen preview (ResumeDocumentTree) — download matches preview
 * exactly, minus any highlight opts (no green backgrounds in the PDF).
 */
export async function renderResumePdf(
  doc: ResumeDocument,
  config: ResumeStyleConfig,
): Promise<Buffer> {
  const stream = await renderToStream(
    <ResumeDocumentTree doc={doc} config={config} />,
  );
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
