"use client";

import { SSEMessage } from "@/lib/types";

interface ProgressIndicatorProps {
  status: SSEMessage | null;
}

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (!status) return null;

  if (status.phase === "error") {
    return (
      <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded-xl font-sans text-sm text-red-800 text-center">
        {status.message || "An error occurred"}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      {/* Spinner */}
      <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />

      {/* Status text */}
      <p className="font-sans text-base text-text">
        {status.phase === "extracting" ? "Extracting slides..." : "Preparing your deck..."}
      </p>

      {/* Subtitle */}
      <p className="font-sans text-sm text-text-muted">
        Annotations will generate as you browse
      </p>
    </div>
  );
}
