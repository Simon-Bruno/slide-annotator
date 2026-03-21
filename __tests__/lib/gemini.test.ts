import { buildSlidePrompt, parseAnnotationResponse } from "@/lib/gemini";
import { Annotation } from "@/lib/types";

describe("buildSlidePrompt", () => {
  it("includes slide number and audience context", () => {
    const prompt = buildSlidePrompt(3, 15);
    expect(prompt).toContain("slide 3 of 15");
    expect(prompt).toContain("Master");
  });
});

describe("parseAnnotationResponse", () => {
  it("parses valid JSON annotation", () => {
    const raw = JSON.stringify({
      slideNumber: 1,
      title: "Test",
      summary: "A summary",
      explanation: "Some explanation with $x^2$",
      keyConcepts: [{ term: "X", definition: "def", detail: "det" }],
      connections: "Builds on previous",
    });
    const result = parseAnnotationResponse(raw, 1);
    expect(result.title).toBe("Test");
    expect(result.slideNumber).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it("returns error annotation for invalid JSON", () => {
    const result = parseAnnotationResponse("not json {{{", 5);
    expect(result.error).toBe(true);
    expect(result.slideNumber).toBe(5);
  });

  it("extracts JSON from markdown code fences", () => {
    const raw = '```json\n{"slideNumber":1,"title":"T","summary":"S","explanation":"E","keyConcepts":[],"connections":"C"}\n```';
    const result = parseAnnotationResponse(raw, 1);
    expect(result.title).toBe("T");
    expect(result.error).toBeUndefined();
  });
});
