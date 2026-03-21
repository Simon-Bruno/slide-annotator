export interface KeyConcept {
  term: string;
  definition: string;
  detail: string;
}

export interface Annotation {
  slideNumber: number;
  title: string;
  summary: string;
  explanation: string;
  keyConcepts: KeyConcept[];
  connections: string;
  error?: boolean;
  message?: string;
}

export interface DeckMetadata {
  title: string;
  slug: string;
  originalFilename: string;
  slideCount: number;
  uploadedAt: string;
  status: "extracting" | "annotating" | "complete" | "partial";
  failedSlides: number[];
}

export interface SSEMessage {
  phase: "extracting" | "annotating" | "complete" | "error";
  current?: number;
  total?: number;
  slug?: string;
  message?: string;
}
