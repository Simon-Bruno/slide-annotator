import { NextRequest, NextResponse } from "next/server";
import {
  loadAnnotations,
  saveAnnotations,
  loadDeckMetadata,
  saveDeckMetadata,
  getSlidesDir,
} from "@/lib/storage";
import { annotateSlide } from "@/lib/gemini";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; slideNumber: string }> }
) {
  const { slug, slideNumber: slideNumStr } = await params;
  const slideNumber = parseInt(slideNumStr, 10);

  if (isNaN(slideNumber) || slideNumber < 1) {
    return NextResponse.json(
      { error: "Invalid slide number" },
      { status: 400 }
    );
  }

  try {
    const metadata = await loadDeckMetadata(slug);
    const annotations = await loadAnnotations(slug);
    const slidesDir = getSlidesDir(slug);

    const newAnnotation = await annotateSlide(
      slidesDir,
      slideNumber,
      metadata.slideCount
    );

    // Replace the annotation in the array
    const idx = annotations.findIndex(
      (a) => a.slideNumber === slideNumber
    );
    if (idx !== -1) {
      annotations[idx] = newAnnotation;
    }

    await saveAnnotations(slug, annotations);

    // Update metadata
    if (!newAnnotation.error) {
      metadata.failedSlides = metadata.failedSlides.filter(
        (n) => n !== slideNumber
      );
      metadata.status =
        metadata.failedSlides.length > 0 ? "partial" : "complete";
      await saveDeckMetadata(metadata);
    }

    return NextResponse.json(newAnnotation);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
