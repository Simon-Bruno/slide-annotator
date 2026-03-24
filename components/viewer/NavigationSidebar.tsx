"use client";

import { useState, useEffect, useCallback } from "react";

interface NavigationSidebarProps {
  slideCount: number;
}

export function NavigationSidebar({ slideCount }: NavigationSidebarProps) {
  const [activeSlide, setActiveSlide] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  // Track active slide via scroll position (more reliable than IntersectionObserver for dynamic content)
  useEffect(() => {
    const handleScroll = () => {
      let closest = 1;
      let closestDistance = Infinity;

      for (let i = 1; i <= slideCount; i++) {
        const el = document.getElementById(`slide-${i}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - 100);
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

  const scrollToSlide = useCallback((num: number) => {
    const el = document.getElementById(`slide-${num}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        scrollToSlide(Math.min(slideCount, activeSlide + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToSlide(Math.max(1, activeSlide - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, slideCount, scrollToSlide]);

  const progress = ((activeSlide - 1) / Math.max(slideCount - 1, 1)) * 100;

  return (
    <>
      {/* Desktop: compact progress bar with hover-to-expand slide list */}
      <nav
        className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-1 py-3 px-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-border/50 shadow-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ maxHeight: "60vh" }}
      >
        <span className="font-sans text-[10px] font-bold text-accent mb-1">
          {activeSlide}
        </span>

        {/* Progress track */}
        <div className="relative w-1.5 flex-1 min-h-[100px] max-h-[300px] bg-bg-subtle rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full bg-accent rounded-full transition-all duration-300"
            style={{ height: `${progress}%` }}
          />
        </div>

        <span className="font-sans text-[10px] text-text-muted mt-1">
          {slideCount}
        </span>

        {/* Expanded slide list on hover */}
        {isHovered && (
          <div className="absolute left-full ml-2 top-0 py-2 px-1 bg-white/95 backdrop-blur-md border border-border/50 rounded-xl shadow-lg max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: slideCount }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => scrollToSlide(num)}
                  className={`
                    px-3 py-1 rounded-lg font-sans text-xs text-left whitespace-nowrap
                    transition-colors duration-150
                    ${num === activeSlide
                      ? "bg-accent text-white font-medium"
                      : "text-text-secondary hover:bg-bg-subtle"
                    }
                  `}
                >
                  Slide {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile: bottom bar with prev/next */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 py-2 px-4 rounded-full bg-white/70 backdrop-blur-md border border-border/50 shadow-sm">
        <button
          type="button"
          onClick={() => scrollToSlide(Math.max(1, activeSlide - 1))}
          className="text-text-muted hover:text-accent transition-colors disabled:opacity-30"
          disabled={activeSlide === 1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="font-sans text-sm font-medium text-text">
          {activeSlide} <span className="text-text-muted">/ {slideCount}</span>
        </span>
        <button
          type="button"
          onClick={() => scrollToSlide(Math.min(slideCount, activeSlide + 1))}
          className="text-text-muted hover:text-accent transition-colors disabled:opacity-30"
          disabled={activeSlide === slideCount}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </nav>
    </>
  );
}
