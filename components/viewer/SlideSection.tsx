"use client";

import { useRef, useState, useEffect } from "react";
import { StickySlide } from "./StickySlide";
import { Explanation } from "./Explanation";
import { Annotation } from "@/lib/types";

interface SlideSectionProps {
  annotation: Annotation;
  slug: string;
  index: number;
}

export function SlideSection({ annotation, slug, index }: SlideSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const slideImageSrc = `/api/slides/${slug}/slide-${String(annotation.slideNumber).padStart(2, "0")}.png`;

  // Entrance animation via keyframe
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Sticky trigger: when the trigger sentinel scrolls out of viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-100px 0px 0px 0px" }
    );

    if (triggerRef.current) observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={`slide-${annotation.slideNumber}`}
      className="opacity-0 animate-fadeInUp"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
    >
      {/* Sentinel element: when this scrolls past the top, we enter sticky mode */}
      <div ref={triggerRef} className="h-0" />

      {/* Summary line — visible when NOT sticky */}
      <div
        className={`text-center mb-8 transition-all duration-400 ease-out ${
          isSticky ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100"
        }`}
      >
        {annotation.summary && (
          <p className="font-display text-xl text-text-secondary italic mt-4">
            {annotation.summary}
          </p>
        )}
      </div>

      {/* Main layout: always a grid, columns change based on sticky state */}
      <div
        className={`
          lg:grid transition-all duration-500 ease-out
          ${isSticky
            ? "lg:grid-cols-[40%_1fr] lg:gap-[5%]"
            : "lg:grid-cols-1"
          }
        `}
      >
        {/* Slide column — always rendered, uses CSS sticky when in sticky mode */}
        <div
          className={`
            transition-all duration-500 ease-out
            ${isSticky ? "lg:sticky lg:top-8 lg:self-start" : "max-w-4xl mx-auto w-full"}
          `}
        >
          <StickySlide
            src={slideImageSrc}
            slideNumber={annotation.slideNumber}
          />
        </div>

        {/* Explanation column — always rendered */}
        <div
          className={`
            transition-all duration-500 ease-out mt-8
            ${isSticky ? "lg:mt-0 opacity-100" : "max-w-3xl mx-auto w-full"}
          `}
        >
          {isSticky && annotation.summary && (
            <p className="font-display text-lg text-text-secondary italic mb-6">
              {annotation.summary}
            </p>
          )}
          <Explanation annotation={annotation} slug={slug} onRetrySuccess={(updated) => { /* parent will handle via state lifting */ }} />
        </div>
      </div>

      {/* Section divider */}
      <div className="mt-20 mb-20 flex justify-center">
        <div className="w-16 h-px bg-accent/20" />
      </div>
    </section>
  );
}
