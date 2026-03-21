import { NextRequest } from "next/server";
import { extractPdfPages } from "@/lib/pdf";
import { annotateSlide } from "@/lib/gemini";
import {
  ensureDeckDir,
  saveDeckMetadata,
  saveAnnotations,
  getSlidesDir,
} from "@/lib/storage";
import { generateSlug } from "@/lib/slug";
import { Annotation, DeckMetadata, SSEMessage } from "@/lib/types";
import path from "path";

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
        send({
          phase: "extracting",
          current: slideCount,
          total: slideCount,
        });

        // Save initial metadata
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

        // Phase 2: Annotate each slide
        const annotations: Annotation[] = [];
        const failedSlides: number[] = [];

        for (let i = 1; i <= slideCount; i++) {
          send({ phase: "annotating", current: i, total: slideCount });

          const slideImagePath = path.join(
            slidesDir,
            `slide-${String(i).padStart(2, "0")}.png`
          );
          const prevImagePath =
            i > 1
              ? path.join(
                  slidesDir,
                  `slide-${String(i - 1).padStart(2, "0")}.png`
                )
              : null;

          const annotation = await annotateSlide(
            slideImagePath,
            prevImagePath,
            i,
            slideCount
          );
          annotations.push(annotation);

          if (annotation.error) {
            failedSlides.push(i);
          }
        }

        // Save results
        await saveAnnotations(slug, annotations);
        metadata.status =
          failedSlides.length > 0 ? "partial" : "complete";
        metadata.failedSlides = failedSlides;
        await saveDeckMetadata(metadata);

        send({ phase: "complete", slug });
      } catch (err) {
        send({ phase: "error", message: (err as Error).message });
      } finally {
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
