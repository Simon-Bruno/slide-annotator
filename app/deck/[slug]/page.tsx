"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { DeckHeader } from "@/components/viewer/DeckHeader";
import { SlideSection } from "@/components/viewer/SlideSection";
import { NavigationSidebar } from "@/components/viewer/NavigationSidebar";
import { Annotation, DeckMetadata } from "@/lib/types";
import Link from "next/link";

export default function DeckPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [metadata, setMetadata] = useState<DeckMetadata | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  const fetchAnnotations = useCallback(async () => {
    try {
      const res = await fetch(`/api/annotations/${slug}`);
      if (!res.ok) return;
      const data = await res.json();
      setAnnotations(data.annotations);

      if (data.status === "complete" || data.status === "partial") {
        setIsGenerating(false);
      }
    } catch {
      // will retry on next poll
    }
  }, [slug]);

  // Load metadata once
  useEffect(() => {
    fetch(`/api/annotations/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setAnnotations(data.annotations);
        if (data.status === "complete" || data.status === "partial") {
          setIsGenerating(false);
        }
      })
      .catch(() => {});

    fetch(`/api/decks`)
      .then((r) => r.json())
      .then((decks: DeckMetadata[]) => {
        const deck = decks.find((d) => d.slug === slug);
        if (deck) setMetadata(deck);
      })
      .catch(() => {});
  }, [slug]);

  // Poll while generating
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(fetchAnnotations, 2000);
    return () => clearInterval(interval);
  }, [isGenerating, fetchAnnotations]);

  if (!metadata) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-sans text-text-muted">Loading...</p>
      </main>
    );
  }

  const completedCount = annotations.filter((a) => !a.pending && a.title).length;

  return (
    <main className="min-h-screen px-6 py-16 lg:pl-20">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans text-sm text-text-muted hover:text-accent transition-colors mb-12"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All decks
        </Link>

        <DeckHeader metadata={metadata} />

        {/* Generation progress banner */}
        {isGenerating && (
          <div className="mb-12 p-4 rounded-xl bg-accent-light/40 border border-accent/10 flex items-center gap-4">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="font-sans text-sm text-accent">
              Generating annotations... {completedCount} of {metadata.slideCount} slides complete
            </p>
          </div>
        )}

        {annotations.map((annotation, i) => (
          <SlideSection
            key={annotation.slideNumber}
            annotation={annotation}
            slug={slug}
            index={i}
          />
        ))}
      </div>

      <NavigationSidebar slideCount={metadata.slideCount} />
    </main>
  );
}
