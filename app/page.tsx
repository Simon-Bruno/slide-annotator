"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "@/components/upload/DropZone";
import { ProgressIndicator } from "@/components/upload/ProgressIndicator";
import { SSEMessage, DeckMetadata } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<SSEMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [decks, setDecks] = useState<DeckMetadata[]>([]);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then(setDecks)
      .catch(() => {});
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setStatus({ phase: "extracting", current: 0, total: 0 });

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const msg: SSEMessage = JSON.parse(line.slice(6));
            setStatus(msg);
            if (msg.phase === "complete" && msg.slug) {
              setTimeout(() => router.push(`/deck/${msg.slug}`), 500);
            }
          }
        }
      }
    } catch (err) {
      setStatus({ phase: "error", message: (err as Error).message });
    } finally {
      setIsUploading(false);
    }
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl font-semibold text-text tracking-tight">
          Slide Annotator
        </h1>
        <p className="font-body text-lg text-text-secondary mt-4 max-w-lg mx-auto leading-reading">
          Upload lecture slides and get AI-powered explanations, beautifully presented.
        </p>
      </div>

      {isUploading ? (
        <ProgressIndicator status={status} />
      ) : (
        <DropZone onFileSelected={handleUpload} />
      )}

      {decks.length > 0 && !isUploading && (
        <div className="mt-20 w-full max-w-2xl">
          <h2 className="font-sans text-sm font-medium text-text-muted uppercase tracking-widest mb-6">
            Your Decks
          </h2>
          <div className="space-y-3">
            {decks.map((deck) => (
              <button
                key={deck.slug}
                type="button"
                onClick={() => router.push(`/deck/${deck.slug}`)}
                className="w-full text-left p-5 rounded-xl bg-white/50 border border-border hover:border-accent/30 hover:bg-accent-light/30 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg text-text group-hover:text-accent transition-colors">
                      {deck.title}
                    </h3>
                    <p className="font-sans text-sm text-text-muted mt-1">
                      {deck.slideCount} slides &middot; {new Date(deck.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted group-hover:text-accent transition-colors">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
