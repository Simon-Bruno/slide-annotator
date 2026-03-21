import { saveDeckMetadata, loadDeckMetadata, loadAnnotations, listDecks, getDeckDir } from "@/lib/storage";
import { DeckMetadata, Annotation } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const TEST_DATA_DIR = path.join(process.cwd(), "data", "__test-deck__");

beforeEach(async () => {
  await fs.mkdir(path.join(TEST_DATA_DIR, "slides"), { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
});

describe("storage", () => {
  it("saves and loads metadata", async () => {
    const meta: DeckMetadata = {
      title: "Test Deck",
      slug: "__test-deck__",
      originalFilename: "test.pdf",
      slideCount: 3,
      uploadedAt: "2026-03-21T14:00:00Z",
      status: "complete",
      failedSlides: [],
    };
    await saveDeckMetadata(meta);
    const loaded = await loadDeckMetadata("__test-deck__");
    expect(loaded).toEqual(meta);
  });

  it("loads annotations", async () => {
    const annotations: Annotation[] = [
      { slideNumber: 1, title: "Test", summary: "s", explanation: "e", keyConcepts: [], connections: "c" },
    ];
    await fs.writeFile(path.join(TEST_DATA_DIR, "annotations.json"), JSON.stringify(annotations));
    const loaded = await loadAnnotations("__test-deck__");
    expect(loaded).toEqual(annotations);
  });

  it("lists decks", async () => {
    const meta: DeckMetadata = {
      title: "Test Deck",
      slug: "__test-deck__",
      originalFilename: "test.pdf",
      slideCount: 3,
      uploadedAt: "2026-03-21T14:00:00Z",
      status: "complete",
      failedSlides: [],
    };
    await saveDeckMetadata(meta);
    const decks = await listDecks();
    expect(decks.some((d) => d.slug === "__test-deck__")).toBe(true);
  });
});
