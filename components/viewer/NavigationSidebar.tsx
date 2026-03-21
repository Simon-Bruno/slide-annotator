"use client";

import { useState, useEffect } from "react";

interface NavigationSidebarProps {
  slideCount: number;
}

export function NavigationSidebar({ slideCount }: NavigationSidebarProps) {
  const [activeSlide, setActiveSlide] = useState(1);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (let i = 1; i <= slideCount; i++) {
      const el = document.getElementById(`slide-${i}`);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSlide(i);
        },
        { threshold: 0.3 }
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [slideCount]);

  const scrollToSlide = (num: number) => {
    const el = document.getElementById(`slide-${num}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Desktop: left sidebar */}
      <nav className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2 py-4 px-2 rounded-full bg-white/60 backdrop-blur-md border border-border/50 shadow-sm">
        {Array.from({ length: slideCount }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => scrollToSlide(num)}
            className="group relative flex items-center justify-center"
            aria-label={`Go to slide ${num}`}
          >
            <div
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${num === activeSlide
                  ? "bg-accent scale-125"
                  : "bg-border hover:bg-accent/50"
                }
              `}
            />
            {/* Tooltip */}
            <span className="absolute left-8 whitespace-nowrap font-sans text-xs text-text bg-white border border-border rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
              Slide {num}
            </span>
          </button>
        ))}
      </nav>

      {/* Mobile: bottom bar */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 py-2 px-4 rounded-full bg-white/60 backdrop-blur-md border border-border/50 shadow-sm">
        {Array.from({ length: slideCount }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => scrollToSlide(num)}
            className="flex items-center justify-center"
            aria-label={`Go to slide ${num}`}
          >
            <div
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${num === activeSlide
                  ? "bg-accent scale-125"
                  : "bg-border"
                }
              `}
            />
          </button>
        ))}
      </nav>
    </>
  );
}
