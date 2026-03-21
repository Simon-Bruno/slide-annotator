import { extractPdfPages } from "@/lib/pdf";
import fs from "fs/promises";
import path from "path";

const TEST_OUTPUT_DIR = path.join(process.cwd(), "data", "__test-pdf-extract__", "slides");

beforeEach(async () => {
  await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
});

afterEach(async () => {
  await fs.rm(path.join(process.cwd(), "data", "__test-pdf-extract__"), { recursive: true, force: true });
});

describe("extractPdfPages", () => {
  it("rejects files over 50MB", async () => {
    const bigBuffer = Buffer.alloc(51 * 1024 * 1024);
    await expect(extractPdfPages(bigBuffer, TEST_OUTPUT_DIR)).rejects.toThrow("exceeds 50MB");
  });

  it("extracts pages as PNG files from a valid PDF", async () => {
    // Use a real small PDF for this test — place a test fixture at __tests__/fixtures/test-2-pages.pdf
    // This test will be skipped if the fixture is not present
    const fixturePath = path.join(process.cwd(), "__tests__", "fixtures", "test-2-pages.pdf");
    try {
      await fs.access(fixturePath);
    } catch {
      console.log("Skipping: no test PDF fixture at", fixturePath);
      return;
    }
    const pdfBuffer = await fs.readFile(fixturePath);
    const count = await extractPdfPages(pdfBuffer, TEST_OUTPUT_DIR);
    expect(count).toBe(2);
    const files = await fs.readdir(TEST_OUTPUT_DIR);
    expect(files).toContain("slide-01.png");
    expect(files).toContain("slide-02.png");
  });
});
