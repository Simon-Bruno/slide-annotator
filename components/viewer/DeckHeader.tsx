import { DeckMetadata } from "@/lib/types";

interface DeckHeaderProps {
  metadata: DeckMetadata;
}

export function DeckHeader({ metadata }: DeckHeaderProps) {
  return (
    <header className="text-center mb-20">
      <p className="font-sans text-sm text-text-muted uppercase tracking-widest mb-4">
        {metadata.slideCount} slides &middot; {new Date(metadata.uploadedAt).toLocaleDateString()}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-semibold text-text tracking-tight leading-tight">
        {metadata.title}
      </h1>
      {metadata.status === "partial" && (
        <p className="font-sans text-sm text-amber-600 mt-4">
          {metadata.failedSlides.length} slide{metadata.failedSlides.length !== 1 ? "s" : ""} could not be annotated
        </p>
      )}
    </header>
  );
}
