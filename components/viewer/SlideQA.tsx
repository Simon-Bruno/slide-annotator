"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";

interface QAEntry {
  slideNumber: number;
  question: string;
  answer: string;
}

interface SlideQAProps {
  slug: string;
  slideCount: number;
}

export function SlideQA({ slug, slideCount }: SlideQAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track which slide is currently in view
  useEffect(() => {
    const handleScroll = () => {
      let closest = 1;
      let closestDistance = Infinity;
      for (let i = 1; i <= slideCount; i++) {
        const el = document.getElementById(`slide-${i}`);
        if (!el) continue;
        const distance = Math.abs(el.getBoundingClientRect().top - 100);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      }
      setActiveSlide(closest);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const timer = setTimeout(handleScroll, 500);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [slideCount]);

  // Auto-scroll chat to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    const slideNum = activeSlide;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/ask/${slug}/${slideNum}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const text = await res.text();
      let data: { answer?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Invalid response from server" };
      }

      if (res.ok && data.answer) {
        setEntries((prev) => [...prev, { slideNumber: slideNum, question, answer: data.answer! }]);
      } else {
        setEntries((prev) => [
          ...prev,
          { slideNumber: slideNum, question, answer: data.error || "Could not get an answer. Try again." },
        ]);
      }
    } catch {
      setEntries((prev) => [
        ...prev,
        { slideNumber: slideNum, question, answer: "Network error. Try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Floating button
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 150);
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        title="Ask about a slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  // Chat entries for current slide
  const currentEntries = entries.filter((e) => e.slideNumber === activeSlide);
  const otherCount = entries.filter((e) => e.slideNumber !== activeSlide).length;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[500px] flex flex-col rounded-2xl bg-white border border-border shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent text-white font-sans text-xs font-bold flex items-center justify-center">
            {activeSlide}
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-text">Slide {activeSlide}</p>
            <p className="font-sans text-[11px] text-text-muted">Ask anything about this slide</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-7 h-7 rounded-full hover:bg-bg-subtle flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-[120px] max-h-[340px]">
        {currentEntries.length === 0 && !loading && (
          <div className="text-center py-6">
            <p className="font-sans text-sm text-text-muted">
              No questions yet for Slide {activeSlide}
            </p>
            <p className="font-sans text-xs text-text-muted mt-1">
              Ask anything — the AI sees the slide image and annotations
            </p>
          </div>
        )}

        {currentEntries.map((entry, i) => (
          <div key={i} className="space-y-2">
            {/* Question */}
            <div className="flex justify-end">
              <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-accent text-white font-sans text-sm">
                {entry.question}
              </div>
            </div>
            {/* Answer */}
            <div className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm bg-bg-subtle font-body text-sm text-text leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                  {entry.answer}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-bg-subtle flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="font-sans text-sm text-text-muted">Thinking...</span>
            </div>
          </div>
        )}

        {otherCount > 0 && (
          <p className="font-sans text-[11px] text-text-muted text-center">
            {otherCount} question{otherCount !== 1 ? "s" : ""} on other slides
          </p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center border-t border-border px-3 py-2 gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about Slide ${activeSlide}...`}
          className="flex-1 px-3 py-2 font-sans text-sm bg-bg-subtle rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30 flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
