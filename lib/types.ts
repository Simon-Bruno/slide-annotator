export interface Region {
  id: number;
  label: string;
  x: number; // 0-1 normalized, center of hotspot
  y: number; // 0-1 normalized, center of hotspot
  annotation: string; // 1-2 sentence explanation tied to this region
}

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
  regions: Region[];
  keyConcepts: KeyConcept[];
  connections: string;
  error?: boolean;
  message?: string;
  pending?: boolean;
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
  phase: "extracting" | "annotating" | "refining" | "complete" | "error";
  current?: number;
  total?: number;
  slug?: string;
  message?: string;
}
