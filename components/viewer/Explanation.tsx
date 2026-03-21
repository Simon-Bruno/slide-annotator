"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";
import { ConceptCard } from "./ConceptCard";
import { ConnectionsBlock } from "./ConnectionsBlock";
import { Annotation } from "@/lib/types";

interface ExplanationProps {
  annotation: Annotation;
  slug: string;
  onRetrySuccess?: (updated: Annotation) => void;
}

export function Explanation({ annotation, slug, onRetrySuccess }: ExplanationProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/retry/${slug}/${annotation.slideNumber}`, { method: "POST" });
      if (res.ok) {
        const updated: Annotation = await res.json();
        onRetrySuccess?.(updated);
      }
    } catch {
      // stay in error state
    } finally {
      setRetrying(false);
    }
  };

  if (annotation.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="font-sans text-sm text-text-muted">Could not generate annotation</p>
        <p className="font-sans text-xs text-text-muted mt-1">{annotation.message}</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-4 px-4 py-2 font-sans text-sm text-accent border border-accent rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {retrying ? "Retrying..." : "Retry annotation"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="font-body text-base text-text leading-reading prose prose-lg max-w-none prose-headings:font-display prose-headings:text-text prose-a:text-accent prose-code:font-mono prose-code:text-sm prose-code:bg-bg-subtle prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
          {annotation.explanation}
        </ReactMarkdown>
      </div>

      {annotation.keyConcepts.length > 0 && (
        <div className="mt-8">
          <h4 className="font-sans text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Key Concepts</h4>
          <div className="space-y-2">
            {annotation.keyConcepts.map((concept) => (
              <ConceptCard key={concept.term} concept={concept} />
            ))}
          </div>
        </div>
      )}

      <ConnectionsBlock connections={annotation.connections} />
    </div>
  );
}
