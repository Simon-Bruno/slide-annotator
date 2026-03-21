import { GoogleGenerativeAI } from "@google/generative-ai";
import { Annotation } from "./types";
import fs from "fs/promises";

const MODEL_NAME = "gemini-3.1-preview";
const MAX_RETRIES = 2;

export function buildSlidePrompt(slideNumber: number, totalSlides: number): string {
  return `You are an expert AI tutor annotating lecture slides for a Master's in Artificial Intelligence student. This is slide ${slideNumber} of ${totalSlides}.

Analyze this lecture slide image and produce a structured annotation. The student has already seen the material and needs consolidation, not introduction. Be direct, precise, and use standard academic notation.

Return a JSON object with exactly this structure:
{
  "slideNumber": ${slideNumber},
  "title": "Concise title for this slide",
  "summary": "One-line TL;DR of what this slide covers",
  "explanation": "Full explanation in markdown. Use LaTeX for math: $...$ for inline, $$...$$ for display blocks. Explain the WHY, not just the what. Be thorough but concise.",
  "keyConcepts": [
    {
      "term": "Concept Name",
      "definition": "Short 1-2 sentence definition",
      "detail": "Deeper explanation with examples, formulas, and intuition"
    }
  ],
  "connections": "How this slide connects to previous and upcoming content in the lecture"
}

Important:
- Use LaTeX notation for ALL mathematical expressions
- Include 2-5 key concepts per slide (fewer for simple slides)
- The explanation should be 150-400 words
- Return ONLY the JSON object, no markdown fences or extra text`;
}

export function parseAnnotationResponse(raw: string, slideNumber: number): Annotation {
  try {
    // Try to extract JSON from markdown code fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = fenceMatch ? fenceMatch[1] : raw;

    const parsed = JSON.parse(jsonStr.trim());
    return {
      slideNumber,
      title: parsed.title || `Slide ${slideNumber}`,
      summary: parsed.summary || "",
      explanation: parsed.explanation || "",
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      connections: parsed.connections || "",
    };
  } catch {
    return {
      slideNumber,
      title: `Slide ${slideNumber}`,
      summary: "",
      explanation: "",
      keyConcepts: [],
      connections: "",
      error: true,
      message: "Failed to parse annotation response",
    };
  }
}

export async function annotateSlide(
  slideImagePath: string,
  previousSlideImagePath: string | null,
  slideNumber: number,
  totalSlides: number
): Promise<Annotation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const slideData = await fs.readFile(slideImagePath);
  const imageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [
    { inlineData: { data: slideData.toString("base64"), mimeType: "image/png" } },
  ];

  // Include previous slide for context
  if (previousSlideImagePath) {
    const prevData = await fs.readFile(previousSlideImagePath);
    imageParts.unshift({
      inlineData: { data: prevData.toString("base64"), mimeType: "image/png" },
    });
  }

  const prompt = buildSlidePrompt(slideNumber, totalSlides);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent([
        prompt,
        ...(previousSlideImagePath ? ["Previous slide for context:", imageParts[0]] : []),
        "Current slide to annotate:",
        imageParts[imageParts.length - 1],
      ]);
      const text = result.response.text();
      return parseAnnotationResponse(text, slideNumber);
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  return {
    slideNumber,
    title: `Slide ${slideNumber}`,
    summary: "",
    explanation: "",
    keyConcepts: [],
    connections: "",
    error: true,
    message: lastError?.message || "Annotation failed after retries",
  };
}
