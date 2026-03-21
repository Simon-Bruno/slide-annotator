"use client";

import { SSEMessage } from "@/lib/types";

interface ProgressIndicatorProps {
  status: SSEMessage | null;
}

const PHASES = [
  { key: "extracting", label: "Extracting slides" },
  { key: "annotating", label: "Generating annotations" },
  { key: "complete", label: "Done" },
];

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (!status) return null;

  const currentPhaseIndex = PHASES.findIndex((p) => p.key === status.phase);

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Phase steps */}
      <div className="flex items-center justify-between">
        {PHASES.map((phase, i) => (
          <div key={phase.key} className="flex items-center gap-3">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm font-medium
                transition-all duration-500
                ${i < currentPhaseIndex
                  ? "bg-accent text-white"
                  : i === currentPhaseIndex
                    ? "bg-accent text-white scale-110"
                    : "bg-bg-subtle text-text-muted"
                }
              `}
            >
              {i < currentPhaseIndex ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`font-sans text-sm transition-colors duration-300 ${i <= currentPhaseIndex ? "text-text" : "text-text-muted"}`}>
              {phase.label}
            </span>
            {i < PHASES.length - 1 && (
              <div className={`w-16 h-px mx-2 transition-colors duration-500 ${i < currentPhaseIndex ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {status.total && status.total > 0 && status.phase !== "complete" && (
        <div className="space-y-2">
          <div className="flex justify-between font-sans text-sm text-text-secondary">
            <span>{status.phase === "extracting" ? "Extracting" : "Annotating"} slide {status.current} of {status.total}</span>
            <span>{Math.round(((status.current || 0) / status.total) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500 ease-out" style={{ width: `${((status.current || 0) / status.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Error state */}
      {status.phase === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl font-sans text-sm text-red-800">
          {status.message || "An error occurred"}
        </div>
      )}
    </div>
  );
}
