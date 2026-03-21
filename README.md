# Slide Annotator

AI-powered lecture slide annotator. Upload a PDF of lecture slides, get Karpathy-style explanations with visual hotspot annotations, interactive Q&A, and a coherent narrative across the entire lecture.

Built for studying Master's-level AI courses.

## Features

- **Visual hotspot annotations** — Gemini identifies key regions on each slide (formulas, diagrams, tables) and overlays color-coded markers with short explanations
- **Progressive rendering** — Redirects to the viewer immediately after extraction; annotations stream in live as they're generated
- **Parallel annotation** — Slides are annotated in batches with a context window of surrounding slides for speed without losing quality
- **Narrative refinement** — A second pass connects all slides into a coherent lecture story, referencing specific slide numbers
- **Floating Q&A tutor** — Ask questions about any slide in a chat panel that tracks which slide you're viewing
- **KaTeX math rendering** — Full LaTeX support for inline and display math
- **Expandable key concepts** — Collapsed by default, click to reveal deeper explanations

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Gemini 3.1 Pro Preview** (multimodal — image input, structured JSON output)
- **pdfjs-dist** + **@napi-rs/canvas** (server-side PDF-to-PNG extraction)
- **KaTeX** + **react-markdown** (math rendering)

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/Simon-Bruno/slide-annotator.git
   cd slide-annotator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Gemini API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your key
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and upload a PDF.

## How It Works

1. **Upload** a PDF of lecture slides
2. **Extraction** — each page is rendered as a PNG at 2x resolution
3. **Annotation** — slides are sent to Gemini in parallel batches (5 at a time), each with its neighboring slides for context
4. **Refinement** — a text-only pass rewrites the "connections" field across all slides for a coherent narrative
5. **Viewing** — slides display with hotspot markers, color-coded annotations, expandable concepts, and an always-available Q&A tutor

## Project Structure

```
app/
  page.tsx                          # Upload page
  deck/[slug]/page.tsx              # Viewer page
  api/
    upload/route.ts                 # PDF upload + extraction + annotation pipeline
    annotations/[slug]/route.ts     # Poll for annotation progress
    slides/[slug]/[filename]/       # Serve slide images
    ask/[slug]/[slideNumber]/       # Q&A endpoint
    retry/[slug]/[slideNumber]/     # Retry failed annotations
components/
  upload/                           # DropZone, ProgressIndicator
  viewer/                           # SlideSection, SlideWithHotspots, Explanation, etc.
lib/
  gemini.ts                         # Gemini API client, prompts, parallel annotation
  pdf.ts                            # PDF-to-PNG extraction
  storage.ts                        # Local filesystem storage
  types.ts                          # Shared TypeScript types
data/                               # Generated slide images + annotations (gitignored)
```

## License

MIT
