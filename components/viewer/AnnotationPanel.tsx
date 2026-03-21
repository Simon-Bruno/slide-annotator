"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";
import { Explanation } from "./Explanation";
import { Annotation } from "@/lib/types";

interface QAEntry {
  question: string;
  answer: string;
}

interface AnnotationPanelProps {
  annotation: Annotation;
  slug: string;
  activeRegion: number | null;
  onRegionHover: (id: number | null) => void;
  onRegionClick: (id: number | null) => void;
}

export function AnnotationPanel({
  annotation,
  slug,
  activeRegion,
  onRegionHover,
  onRegionClick,
}: AnnotationPanelProps) {
  const [mode, setMode] = useState<"notes" | "ask">("notes");

  // Q&A state lives here so it persists across tab switches
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "ask") inputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    const entryIndex = entries.length;
    setEntries((prev) => [...prev, { question, answer: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/ask/${slug}/${annotation.slideNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        let error = "Could not get an answer. Try again.";
        try { error = JSON.parse(text).error || error; } catch {}
        setEntries((prev) => {
          const updated = [...prev];
          updated[entryIndex] = { ...updated[entryIndex], answer: error };
          return updated;
        });
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setEntries((prev) => {
            const updated = [...prev];
            updated[entryIndex] = {
              ...updated[entryIndex],
              answer: updated[entryIndex].answer + chunk,
            };
            return updated;
          });
        }
      }
    } catch {
      setEntries((prev) => {
        const updated = [...prev];
        updated[entryIndex] = { ...updated[entryIndex], answer: "Network error. Try again." };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const showTabs = !annotation.pending && annotation.title && !annotation.error;

  return (
    <div>
      {/* Tab bar */}
      {showTabs && (
        <div className="flex items-center gap-1 mb-5 p-1 bg-bg-subtle rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setMode("notes")}
            className={`px-4 py-1.5 rounded-lg font-sans text-sm font-medium transition-all duration-200
              ${mode === "notes" ? "bg-white text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setMode("ask")}
            className={`px-4 py-1.5 rounded-lg font-sans text-sm font-medium transition-all duration-200 flex items-center gap-1.5
              ${mode === "ask" ? "bg-white text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            Ask
            {entries.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {entries.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Notes mode */}
      <div className={mode === "notes" ? "block" : "hidden"}>
        <Explanation
          annotation={annotation}
          slug={slug}
          activeRegion={activeRegion}
          onRegionHover={onRegionHover}
          onRegionClick={onRegionClick}
          onRetrySuccess={() => {}}
        />
      </div>

      {/* Ask mode — matches slide aspect ratio (4:3 ≈ 75%), scrollable */}
      <div className={mode === "ask" ? "flex flex-col aspect-[4/3]" : "hidden"}>
        {/* Messages — fixed scrollable area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pb-4 min-h-0">
          {entries.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="font-sans text-sm text-text-secondary font-medium">Ask anything about this slide</p>
              <p className="font-sans text-xs text-text-muted mt-1 max-w-[280px]">
                The AI sees the slide image and all annotations. Try asking about formulas, concepts, or comparisons.
              </p>
            </div>
          )}

          {entries.map((entry, i) => (
            <div key={i} className="space-y-4">
              {/* Question — left aligned */}
              <div className="flex justify-start">
                <div className="max-w-[85%] flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent text-white font-sans text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">Q</div>
                  <p className="font-sans text-sm font-medium text-text pt-0.5 px-3 py-2 bg-accent-light/50 rounded-2xl rounded-tl-sm">{entry.question}</p>
                </div>
              </div>
              {/* Answer — right aligned */}
              {entry.answer ? (
                <div className="flex justify-end">
                  <div className="max-w-[90%] flex items-start gap-2 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-bg-subtle text-accent font-sans text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-accent/20">A</div>
                    <div className="font-body text-[15px] text-text leading-reading prose prose-sm max-w-none prose-headings:font-display prose-a:text-accent prose-code:font-mono prose-code:text-sm prose-code:bg-bg-subtle prose-code:px-1 prose-code:rounded min-w-0 px-3 py-2 bg-bg-subtle/50 rounded-2xl rounded-tr-sm">
                      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                        {entry.answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-bg-subtle/50 rounded-2xl rounded-tr-sm">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="font-sans text-sm text-text-muted">Thinking...</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-bg-subtle text-accent font-sans text-[10px] font-bold flex items-center justify-center flex-shrink-0 border border-accent/20">A</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input — always pinned to bottom */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 border-t border-border flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2.5 font-sans text-sm bg-bg-subtle rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30 flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
