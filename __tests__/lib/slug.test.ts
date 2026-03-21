import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    const slug = generateSlug("Bellman Equations Lecture", 1711043200);
    expect(slug).toBe("bellman-equations-lecture-1711043200");
  });

  it("strips special characters", () => {
    const slug = generateSlug("IR1_lecture_genir (2).pdf", 1711043200);
    expect(slug).toBe("ir1-lecture-genir-2-pdf-1711043200");
  });

  it("collapses consecutive hyphens", () => {
    const slug = generateSlug("hello---world", 1711043200);
    expect(slug).toBe("hello-world-1711043200");
  });

  it("truncates to 60 chars before timestamp", () => {
    const longName = "a".repeat(100);
    const slug = generateSlug(longName, 1711043200);
    const prefix = slug.replace(/-1711043200$/, "");
    expect(prefix.length).toBeLessThanOrEqual(60);
  });

  it("trims leading and trailing hyphens from prefix", () => {
    const slug = generateSlug("--hello--", 1711043200);
    expect(slug).toBe("hello-1711043200");
  });
});
