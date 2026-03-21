"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";
import { KeyConcept } from "@/lib/types";

interface ConceptCardProps {
  concept: KeyConcept;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-bg-subtle/50 transition-colors"
      >
        <span className="font-sans text-sm font-medium text-accent">{concept.term}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-4 border-t border-border">
          <p className="font-body text-sm text-text-secondary mt-3 leading-reading">{concept.definition}</p>
          {concept.detail && (
            <div className="mt-3 font-body text-sm text-text leading-reading prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                {concept.detail}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
