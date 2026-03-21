import { GoogleGenerativeAI } from "@google/generative-ai";
import { Annotation } from "./types";
import fs from "fs/promises";
import path from "path";

const MODEL_NAME = "gemini-3.1-pro-preview";
const MAX_RETRIES = 2;
const CONTEXT_WINDOW = 1; // ±1 slides for context (fast, handles "Continued..." slides)
const BATCH_SIZE = 5; // parallel calls per batch

export function buildSlidePrompt(
  slideNumber: number,
  totalSlides: number,
  contextSlideNumbers: number[]
): string {
  const contextNote =
    contextSlideNumbers.length > 1
      ? `\n\nYou are also provided with surrounding slides (${contextSlideNumbers.join(", ")}) for context. These help you understand how slide ${slideNumber} fits into the lecture flow. However, annotate ONLY slide ${slideNumber}.`
      : "";

  return `You are an expert AI tutor annotating lecture slides for a Master's in Artificial Intelligence student, in the clear and insightful style of Andrej Karpathy. This is slide ${slideNumber} of ${totalSlides}.${contextNote}

Analyze the target slide image. Identify the 2-5 most important visual elements (formulas, diagrams, key bullet points, tables, graphs) and annotate each one with a short, insightful explanation tied directly to that element.

Return a JSON object with this structure:
{
  "slideNumber": ${slideNumber},
  "title": "Concise title for this slide",
  "summary": "One punchy sentence — the key insight of this slide",
  "regions": [
    {
      "id": 1,
      "label": "Short label (e.g. 'Bellman Equation', 'Backup Diagram')",
      "x": 0.5,
      "y": 0.3,
      "annotation": "1-2 sentences explaining THIS specific element. Be direct. Use LaTeX for math: $...$"
    }
  ],
  "explanation": "2-3 sentences: the big picture of what this slide is saying and WHY it matters. Keep it short — the regions carry the detail.",
  "keyConcepts": [
    {
      "term": "Concept Name",
      "definition": "One sentence definition",
      "detail": "Deeper explanation with intuition and formulas"
    }
  ],
  "connections": "How this slide connects to previous and upcoming content"
}

CRITICAL for regions:
- x and y are normalized coordinates (0-1) pointing to the CENTER of the visual element on the slide
- x=0 is left edge, x=1 is right edge, y=0 is top, y=1 is bottom
- Identify 2-5 regions per slide — the most important visual elements
- Each annotation should be 1-2 sentences, directly about THAT element
- For title-only or transition slides, use 1 region at the center

Important:
- Use LaTeX notation for ALL math: $...$ inline, $$...$$ display
- Keep the main "explanation" SHORT (2-3 sentences max) — regions do the heavy lifting
- 1-3 key concepts per slide
- Return ONLY the JSON object, no markdown fences`;
}

export function parseAnnotationResponse(raw: string, slideNumber: number): Annotation {
  try {
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = fenceMatch ? fenceMatch[1] : raw;

    const parsed = JSON.parse(jsonStr.trim());
    return {
      slideNumber,
      title: parsed.title || `Slide ${slideNumber}`,
      summary: parsed.summary || "",
      explanation: parsed.explanation || "",
      regions: Array.isArray(parsed.regions) ? parsed.regions : [],
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      connections: parsed.connections || "",
    };
  } catch {
    return {
      slideNumber,
      title: `Slide ${slideNumber}`,
      summary: "",
      explanation: "",
      regions: [],
      keyConcepts: [],
      connections: "",
      error: true,
      message: "Failed to parse annotation response",
    };
  }
}

function getContextWindow(slideNumber: number, totalSlides: number): number[] {
  const start = Math.max(1, slideNumber - CONTEXT_WINDOW);
  const end = Math.min(totalSlides, slideNumber + CONTEXT_WINDOW);
  const slides: number[] = [];
  for (let i = start; i <= end; i++) {
    slides.push(i);
  }
  return slides;
}

function slideFilename(num: number): string {
  return `slide-${String(num).padStart(2, "0")}.png`;
}

/**
 * Annotate a single slide with a context window of surrounding slides.
 */
export async function annotateSlide(
  slidesDir: string,
  slideNumber: number,
  totalSlides: number
): Promise<Annotation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const contextSlides = getContextWindow(slideNumber, totalSlides);
  const prompt = buildSlidePrompt(slideNumber, totalSlides, contextSlides);

  // Build content array with context slide images
  const contentParts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];

  for (const num of contextSlides) {
    const imgPath = path.join(slidesDir, slideFilename(num));
    const imgData = await fs.readFile(imgPath);
    const label = num === slideNumber ? `[TARGET] Slide ${num}:` : `Slide ${num} (context):`;
    contentParts.push(label);
    contentParts.push({
      inlineData: { data: imgData.toString("base64"), mimeType: "image/png" },
    });
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(contentParts);
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
    regions: [],
    keyConcepts: [],
    connections: "",
    error: true,
    message: lastError?.message || "Annotation failed after retries",
  };
}

/**
 * Annotate all slides in a deck using context window parallelism.
 * Slides are annotated in batches of BATCH_SIZE, each with ±CONTEXT_WINDOW surrounding slides.
 * Returns annotations in order, plus calls onProgress for each completed slide.
 */
export async function annotateAllSlides(
  slidesDir: string,
  totalSlides: number,
  onProgress?: (completed: number, annotation: Annotation) => void
): Promise<Annotation[]> {
  const results: Annotation[] = new Array(totalSlides);
  let completedCount = 0;

  // Process in batches of BATCH_SIZE
  for (let batchStart = 1; batchStart <= totalSlides; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalSlides);
    const batchPromises: Promise<void>[] = [];

    for (let i = batchStart; i <= batchEnd; i++) {
      const slideNum = i;
      batchPromises.push(
        annotateSlide(slidesDir, slideNum, totalSlides).then((annotation) => {
          results[slideNum - 1] = annotation;
          completedCount++;
          onProgress?.(completedCount, annotation);
        })
      );
    }

    await Promise.all(batchPromises);
  }

  return results;
}

/**
 * Second pass: send all annotation texts to Gemini to create a coherent
 * narrative thread across the entire lecture. Text-only (no images), fast and cheap.
 */
export async function refineConnections(annotations: Annotation[]): Promise<Annotation[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return annotations;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Build a compact summary of all slides for context
  const lectureOutline = annotations
    .filter((a) => !a.error)
    .map((a) => `Slide ${a.slideNumber}: "${a.title}" — ${a.summary}`)
    .join("\n");

  const prompt = `You are refining the "connections" field for a set of annotated lecture slides in a Master's AI course. Below is the full lecture outline:

${lectureOutline}

For each slide, write an improved "connections" field that:
- References specific earlier slides by number when concepts build on each other (e.g., "This builds on the objective function $J(\\theta)$ from Slide 1")
- References upcoming slides when the current slide is setting up for something
- Creates a coherent narrative arc across the entire lecture
- Is 2-4 sentences, direct and precise, in the style of Andrej Karpathy's explanations

Return a JSON array with objects like:
[
  { "slideNumber": 1, "connections": "..." },
  { "slideNumber": 2, "connections": "..." },
  ...
]

Only include slides that are NOT in error state. Return ONLY the JSON array.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = fenceMatch ? fenceMatch[1] : text;
    const refined: Array<{ slideNumber: number; connections: string }> = JSON.parse(jsonStr.trim());

    // Merge refined connections back into annotations
    const connectionsMap = new Map(refined.map((r) => [r.slideNumber, r.connections]));
    return annotations.map((a) => {
      const newConn = connectionsMap.get(a.slideNumber);
      if (newConn && !a.error) {
        return { ...a, connections: newConn };
      }
      return a;
    });
  } catch {
    // If refinement fails, just return the original annotations — no harm done
    return annotations;
  }
}
