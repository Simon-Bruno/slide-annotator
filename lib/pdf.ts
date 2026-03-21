// Use the legacy build for Node.js server-side rendering (no worker needed)
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_PAGES = 100;
const RENDER_SCALE = 2; // 2x for crisp slide images

export async function extractPdfPages(
  pdfBuffer: Buffer,
  outputDir: string
): Promise<number> {
  if (pdfBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(`PDF exceeds 50MB limit (${(pdfBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`);
  }

  const data = new Uint8Array(pdfBuffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const pageCount = Math.min(doc.numPages, MAX_PAGES);

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as any,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    const filename = `slide-${String(i).padStart(2, "0")}.png`;
    await fs.writeFile(path.join(outputDir, filename), pngBuffer);

    page.cleanup();
  }

  await doc.cleanup();
  return pageCount;
}
