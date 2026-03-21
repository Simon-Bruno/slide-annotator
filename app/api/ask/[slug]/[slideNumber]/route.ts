import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadAnnotations, getSlidesDir } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

const MODEL_NAME = "gemini-3.1-pro-preview";

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

    // Load the slide image and existing annotation for context
    const slidesDir = getSlidesDir(slug);
    const slideImagePath = path.join(slidesDir, `slide-${String(slideNumber).padStart(2, "0")}.png`);
    const slideData = await fs.readFile(slideImagePath);

    const annotations = await loadAnnotations(slug);
    const annotation = annotations.find((a) => a.slideNumber === slideNumber);
    const context = annotation
      ? `Existing annotation for this slide:\nTitle: ${annotation.title}\nSummary: ${annotation.summary}\nExplanation: ${annotation.explanation}`
      : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent([
      `You are an expert AI tutor helping a Master's AI student understand a lecture slide. Answer their question directly, concisely, and precisely. Use LaTeX ($...$) for math. Keep your answer to 2-5 sentences unless the question requires more detail.

${context}

Student's question: ${question}`,
      "The slide:",
      { inlineData: { data: slideData.toString("base64"), mimeType: "image/png" } },
    ]);

    const answer = result.response.text();
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
