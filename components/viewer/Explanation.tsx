"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";
import { ConceptCard } from "./ConceptCard";
import { ConnectionsBlock } from "./ConnectionsBlock";
import { Annotation } from "@/lib/types";
import { REGION_COLORS } from "./SlideWithHotspots";

interface ExplanationProps {
  annotation: Annotation;
  slug: string;
  activeRegion: number | null;
  onRegionHover: (id: number | null) => void;
  onRegionClick: (id: number | null) => void;
  onRetrySuccess?: (updated: Annotation) => void;
}

export function Explanation({
  annotation,
  slug,
  activeRegion,
  onRegionHover,
  onRegionClick,
  onRetrySuccess,
}: ExplanationProps) {
  const [retrying, setRetrying] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);

  // Pending state
  if (annotation.pending || (!annotation.title && !annotation.error)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-sans text-sm text-text-muted">Generating annotation...</p>
      </div>
    );
  }

  // Error state
  if (annotation.error) {
    const handleRetry = async () => {
      setRetrying(true);
      try {
        const res = await fetch(`/api/retry/${slug}/${annotation.slideNumber}`, { method: "POST" });
        if (res.ok) {
          const updated: Annotation = await res.json();
          onRetrySuccess?.(updated);
        }
      } catch {}
      finally { setRetrying(false); }
    };

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-sans text-sm text-text-muted mb-2">Could not generate annotation</p>
        <p className="font-sans text-xs text-text-muted">{annotation.message}</p>
        <button type="button" onClick={handleRetry} disabled={retrying}
          className="mt-4 px-4 py-2 font-sans text-sm text-accent border border-accent rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50">
          {retrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  const regions = annotation.regions || [];

  return (
    <div className="space-y-4">
      {/* Brief explanation */}
      {annotation.explanation && (
        <div className="font-body text-[15px] text-text leading-reading">
          <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
            {annotation.explanation}
          </ReactMarkdown>
        </div>
      )}

      {/* Region annotations — color-coded cards */}
      {regions.length > 0 && (
        <div className="space-y-2.5">
          {regions.map((region, i) => {
            const color = REGION_COLORS[i % REGION_COLORS.length];
            const isActive = activeRegion === region.id;

            return (
              <div
                key={region.id}
                onMouseEnter={() => onRegionHover(region.id)}
                onMouseLeave={() => onRegionHover(null)}
                onClick={() => onRegionClick(isActive ? null : region.id)}
                className={`
                  p-4 rounded-xl cursor-pointer
                  transition-all duration-200
                  ${isActive ? "shadow-md scale-[1.01]" : "hover:shadow-sm"}
                `}
                style={{
                  borderTop: isActive ? `1px solid ${color}30` : "1px solid transparent",
                  borderRight: isActive ? `1px solid ${color}30` : "1px solid transparent",
                  borderBottom: isActive ? `1px solid ${color}30` : "1px solid transparent",
                  borderLeft: `3px solid ${color}`,
                  backgroundColor: isActive ? `${color}08` : "transparent",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-sans text-[10px] font-bold mt-0.5"
                    style={{
                      backgroundColor: isActive ? color : `${color}15`,
                      color: isActive ? "white" : color,
                    }}
                  >
                    {region.id}
                  </span>
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold text-text leading-tight">
                      {region.label}
                    </p>
                    <div className="font-body text-sm text-text-secondary leading-relaxed mt-1 prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                        {region.annotation}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Key concepts — collapsed toggle */}
      {annotation.keyConcepts.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowConcepts(!showConcepts)}
            className="font-sans text-xs font-medium text-text-muted uppercase tracking-widest hover:text-accent transition-colors flex items-center gap-2"
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform duration-200 ${showConcepts ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {annotation.keyConcepts.length} Key Concept{annotation.keyConcepts.length !== 1 ? "s" : ""}
          </button>

          {showConcepts && (
            <div className="mt-3 space-y-2">
              {annotation.keyConcepts.map((concept) => (
                <ConceptCard key={concept.term} concept={concept} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connections */}
      <ConnectionsBlock connections={annotation.connections} />
    </div>
  );
}
