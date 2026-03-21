import { NextRequest } from "next/server";
import { extractPdfPages } from "@/lib/pdf";
import { annotateAllSlides, refineConnections } from "@/lib/gemini";
import {
  ensureDeckDir,
  saveDeckMetadata,
  saveAnnotations,
  getSlidesDir,
} from "@/lib/storage";
import { generateSlug } from "@/lib/slug";
import { Annotation, DeckMetadata, SSEMessage } from "@/lib/types";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(msg: SSEMessage) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
      }

      try {
        const formData = await request.formData();
        const file = formData.get("pdf") as File | null;

        if (!file) {
          send({ phase: "error", message: "No PDF file provided" });
          controller.close();
          return;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Math.floor(Date.now() / 1000);
        const slug = generateSlug(
          file.name.replace(/\.pdf$/i, ""),
          timestamp
        );
        const title = file.name
          .replace(/\.pdf$/i, "")
          .replace(/[-_]+/g, " ");

        await ensureDeckDir(slug);
        const slidesDir = getSlidesDir(slug);

        // Phase 1: Extract slides
        send({ phase: "extracting", current: 0, total: 0 });
        let slideCount: number;
        try {
          slideCount = await extractPdfPages(buffer, slidesDir);
        } catch (err) {
          send({ phase: "error", message: (err as Error).message });
          controller.close();
          return;
        }

        // Save metadata with "annotating" status and empty annotations
        const metadata: DeckMetadata = {
          title,
          slug,
          originalFilename: file.name,
          slideCount,
          uploadedAt: new Date().toISOString(),
          status: "annotating",
          failedSlides: [],
        };
        await saveDeckMetadata(metadata);

        // Save empty annotations array — viewer will poll for updates
        const emptyAnnotations: Annotation[] = Array.from(
          { length: slideCount },
          (_, i) => ({
            slideNumber: i + 1,
            title: "",
            summary: "",
            explanation: "",
            regions: [],
            keyConcepts: [],
            connections: "",
            error: false,
            pending: true,
          })
        );
        await saveAnnotations(slug, emptyAnnotations);

        // Redirect to viewer immediately — annotations will stream in
        send({ phase: "complete", slug });
        controller.close();

        // Continue annotating in the background
        annotateInBackground(slidesDir, slug, slideCount, metadata);
      } catch (err) {
        send({ phase: "error", message: (err as Error).message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Runs annotation in the background after the client has been redirected.
 * Saves annotations incrementally so the viewer can poll for updates.
 */
async function annotateInBackground(
  slidesDir: string,
  slug: string,
  slideCount: number,
  metadata: DeckMetadata
) {
  try {
    let annotations = await annotateAllSlides(
      slidesDir,
      slideCount,
      async (completed, annotation) => {
        // Save incrementally after each slide completes
        const { loadAnnotations, saveAnnotations } = await import("@/lib/storage");
        const current = await loadAnnotations(slug);
        current[annotation.slideNumber - 1] = annotation;
        await saveAnnotations(slug, current);
      }
    );

    // Refine connections with full lecture narrative
    annotations = await refineConnections(annotations);

    const failedSlides = annotations
      .filter((a) => a.error)
      .map((a) => a.slideNumber);

    // Save final results
    await saveAnnotations(slug, annotations);
    metadata.status = failedSlides.length > 0 ? "partial" : "complete";
    metadata.failedSlides = failedSlides;
    await saveDeckMetadata(metadata);
  } catch (err) {
    console.error("Background annotation failed:", err);
    metadata.status = "partial";
    await saveDeckMetadata(metadata);
  }
}
