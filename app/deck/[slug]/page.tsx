import { loadDeckMetadata, loadAnnotations } from "@/lib/storage";
import { DeckHeader } from "@/components/viewer/DeckHeader";
import { SlideSection } from "@/components/viewer/SlideSection";
import { NavigationSidebar } from "@/components/viewer/NavigationSidebar";
import { notFound } from "next/navigation";
import Link from "next/link";

interface DeckPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { slug } = await params;

  let metadata;
  let annotations;
  try {
    metadata = await loadDeckMetadata(slug);
    annotations = await loadAnnotations(slug);
  } catch {
    notFound();
  }

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

export async function generateMetadata({ params }: DeckPageProps) {
  const { slug } = await params;
  try {
    const metadata = await loadDeckMetadata(slug);
    return { title: `${metadata.title} — Slide Annotator` };
  } catch {
    return { title: "Deck Not Found — Slide Annotator" };
  }
}
