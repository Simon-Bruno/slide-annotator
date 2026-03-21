"use client";

import { useRef, useState, useEffect } from "react";
import { SlideWithHotspots } from "./SlideWithHotspots";
import { Explanation } from "./Explanation";
import { Annotation } from "@/lib/types";

interface SlideSectionProps {
  annotation: Annotation;
  slug: string;
  index: number;
}

export function SlideSection({ annotation, slug, index }: SlideSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeRegion, setActiveRegion] = useState<number | null>(null);

  const slideImageSrc = `/api/slides/${slug}/slide-${String(annotation.slideNumber).padStart(2, "0")}.png`;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleRegionActivate = (id: number | null) => {
    setActiveRegion(id);
  };

  return (
    <section
      ref={sectionRef}
      id={`slide-${annotation.slideNumber}`}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Summary */}
      {annotation.summary && (
        <p className="font-display text-lg text-text-secondary italic text-center mb-6">
          {annotation.summary}
        </p>
      )}

      {/* Two-column layout with connector gap */}
      <div className="lg:grid lg:grid-cols-[50%_1fr] lg:gap-12 relative">
        {/* Slide with edge notches — sticky on desktop */}
        <div className="lg:sticky lg:top-8 lg:self-start lg:pr-4">
          <SlideWithHotspots
            src={slideImageSrc}
            slideNumber={annotation.slideNumber}
            regions={annotation.regions || []}
            activeRegion={activeRegion}
            onRegionHover={handleRegionActivate}
            onRegionClick={handleRegionActivate}
          />
        </div>

        {/* Annotations panel */}
        <div className="mt-6 lg:mt-0">
          <Explanation
            annotation={annotation}
            slug={slug}
            activeRegion={activeRegion}
            onRegionHover={handleRegionActivate}
            onRegionClick={handleRegionActivate}
            onRetrySuccess={() => {}}
          />
        </div>
      </div>

      {/* Section divider */}
      <div className="mt-16 mb-16 flex justify-center">
        <div className="w-16 h-px bg-accent/20" />
      </div>
    </section>
  );
}
