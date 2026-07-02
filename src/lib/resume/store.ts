import { uploadFile, R2_KEYS } from "@/lib/r2";

/*
 * storeResumePdf
 * Uploads a rendered resume PDF buffer to R2 at R2_KEYS.resumeGenerated(seekerId)
 * (overwrites the seeker's previous generated PDF). Wraps the Buffer in a File
 * (global in the Next.js Node runtime) so it reuses lib/r2's uploadFile — no new
 * S3 code paths.
 * @param seekerId - SeekerProfile id (owns the resumes/{seekerId}/ prefix)
 * @param pdf - Buffer from renderResumePdf()
 * @returns { key, url } — persist `key`, never the URL (URLs expire).
 */
export async function storeResumePdf(
  seekerId: string,
  pdf: Buffer,
): Promise<{ key: string; url: string }> {
  const key = R2_KEYS.resumeGenerated(seekerId);
  const file = new File([new Uint8Array(pdf)], "generated.pdf", {
    type: "application/pdf",
  });
  const { url } = await uploadFile(file, key);
  return { key, url };
}
