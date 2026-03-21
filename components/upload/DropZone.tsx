"use client";

import { useCallback, useState, DragEvent } from "react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      onFileSelected(file);
    }
  }, [onFileSelected, disabled]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onFileSelected(file);
    };
    input.click();
  }, [onFileSelected, disabled]);

  return (
    <button
      type="button"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      disabled={disabled}
      className={`
        w-full max-w-2xl aspect-[3/2] rounded-2xl
        flex flex-col items-center justify-center gap-4
        cursor-pointer transition-all duration-300 ease-out
        ${isDragging
          ? "border-2 border-solid border-accent bg-accent-light scale-[1.02]"
          : "border-2 border-dashed border-border hover:border-accent/50 hover:bg-bg-subtle/50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-sans text-lg text-text">
          Drop a PDF here or <span className="text-accent underline underline-offset-4">browse</span>
        </p>
        <p className="font-sans text-sm text-text-muted mt-1">
          Lecture slides up to 50MB, max 100 pages
        </p>
      </div>
    </button>
  );
}
