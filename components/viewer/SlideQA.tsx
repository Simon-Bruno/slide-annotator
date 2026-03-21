"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";

interface QAEntry {
  question: string;
  answer: string;
}

interface SlideQAProps {
  slug: string;
  slideNumber: number;
}

export function SlideQA({ slug, slideNumber }: SlideQAProps) {
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom
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
      const res = await fetch(`/api/ask/${slug}/${slideNumber}`, {
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

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pb-4">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="font-sans text-sm text-text-secondary font-medium">Ask anything about this slide</p>
            <p className="font-sans text-xs text-text-muted mt-1 max-w-[280px]">
              The AI can see the slide image and all annotations. Try asking about formulas, concepts, or comparisons.
            </p>
          </div>
        )}

        {entries.map((entry, i) => (
          <div key={i} className="space-y-3">
            {/* Question */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-accent text-white font-sans text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                Q
              </div>
              <p className="font-sans text-sm font-medium text-text pt-0.5">
                {entry.question}
              </p>
            </div>
            {/* Answer */}
            {entry.answer ? (
              <div className="pl-8 font-body text-[15px] text-text leading-reading prose prose-sm max-w-none prose-headings:font-display prose-a:text-accent prose-code:font-mono prose-code:text-sm prose-code:bg-bg-subtle prose-code:px-1 prose-code:rounded">
                <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                  {entry.answer}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="pl-8 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="font-sans text-sm text-text-muted">Thinking...</span>
              </div>
            )}

            {/* Separator between Q&A pairs */}
            {i < entries.length - 1 && (
              <div className="pl-8 pt-2">
                <div className="w-8 h-px bg-border" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input bar — pinned to bottom */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 border-t border-border">
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
  );
}
