import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadAnnotations, getSlidesDir } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

const MODEL_NAME = "gemini-3-flash-preview";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; slideNumber: string }> }
) {
  const { slug, slideNumber: slideNumStr } = await params;
  const slideNumber = parseInt(slideNumStr, 10);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not set" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const question = body.question;
    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const annotations = await loadAnnotations(slug);
    const annotation = annotations.find((a) => a.slideNumber === slideNumber);
    const regions = annotation?.regions?.map((r) => `[${r.label}]: ${r.annotation}`).join("\n") || "";
    const concepts = annotation?.keyConcepts?.map((c) => `${c.term}: ${c.definition} — ${c.detail}`).join("\n") || "";
    const context = annotation
      ? `Slide ${slideNumber}: "${annotation.title}"\nSummary: ${annotation.summary}\nExplanation: ${annotation.explanation}\nRegions:\n${regions}\nKey Concepts:\n${concepts}\nConnections: ${annotation.connections}`
      : "";

    // Load slide image
    const slidesDir = getSlidesDir(slug);
    const slideImagePath = path.join(slidesDir, `slide-${String(slideNumber).padStart(2, "0")}.png`);
    const slideData = await fs.readFile(slideImagePath);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContentStream([
      `You are a helpful tutor explaining a lecture slide. Answer simply and intuitively — like you're explaining to a smart friend, not writing a textbook. Avoid jargon unless the student used it first. Use short sentences. Use LaTeX ($...$) for math. Keep answers to 2-4 sentences max.

${context}

Student's question: ${question}`,
      "The slide:",
      { inlineData: { data: slideData.toString("base64"), mimeType: "image/png" } },
    ]);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`\n\n[Error: ${(err as Error).message}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
