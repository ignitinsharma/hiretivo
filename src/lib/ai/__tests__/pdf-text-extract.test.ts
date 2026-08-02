import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractPdfText } from "../pdf-text-extract";

describe("extractPdfText", () => {
  it("extracts text from a text-based PDF", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage();
    page.drawText("Python TypeScript AWS", { x: 50, y: 700, font, size: 12 });
    const text = await extractPdfText(Buffer.from(await doc.save()));
    assert.ok(text.includes("Python"));
    assert.ok(text.includes("TypeScript"));
  });

  it("returns empty string for unparseable input", async () => {
    assert.equal(await extractPdfText(Buffer.from("not a pdf")), "");
  });
});
