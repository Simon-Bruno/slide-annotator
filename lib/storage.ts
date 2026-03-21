import fs from "fs/promises";
import path from "path";
import { DeckMetadata, Annotation } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getDeckDir(slug: string): string {
  return path.join(DATA_DIR, slug);
}

export function getSlidesDir(slug: string): string {
  return path.join(getDeckDir(slug), "slides");
}

export async function ensureDeckDir(slug: string): Promise<void> {
  await fs.mkdir(getSlidesDir(slug), { recursive: true });
}

export async function saveDeckMetadata(metadata: DeckMetadata): Promise<void> {
  const dir = getDeckDir(metadata.slug);
  await fs.writeFile(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, 2));
}

export async function loadDeckMetadata(slug: string): Promise<DeckMetadata> {
  const raw = await fs.readFile(path.join(getDeckDir(slug), "metadata.json"), "utf-8");
  return JSON.parse(raw);
}

export async function saveAnnotations(slug: string, annotations: Annotation[]): Promise<void> {
  await fs.writeFile(
    path.join(getDeckDir(slug), "annotations.json"),
    JSON.stringify(annotations, null, 2)
  );
}

export async function loadAnnotations(slug: string): Promise<Annotation[]> {
  const raw = await fs.readFile(path.join(getDeckDir(slug), "annotations.json"), "utf-8");
  return JSON.parse(raw);
}

export async function listDecks(): Promise<DeckMetadata[]> {
  try {
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const decks: DeckMetadata[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      try {
        const meta = await loadDeckMetadata(entry.name);
        decks.push(meta);
      } catch {
        // skip directories without valid metadata
      }
    }
    return decks.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch {
    return [];
  }
}
