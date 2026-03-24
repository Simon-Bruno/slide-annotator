"use client";

const shortcuts = [
  { keys: ["↑", "←"], description: "Previous slide" },
  { keys: ["↓", "→"], description: "Next slide" },
  { keys: ["Q"], description: "Toggle Notes / Ask" },
];

export function KeyboardShortcutsHelp() {
  return (
    <div className="fixed top-5 right-5 z-50 group">
      <div className="w-7 h-7 rounded-full border border-border/60 bg-white/70 backdrop-blur-md flex items-center justify-center cursor-default text-text-muted group-hover:text-accent group-hover:border-accent/30 transition-colors">
        <span className="font-sans text-xs font-semibold">?</span>
      </div>

      <div className="absolute top-full right-0 mt-2 w-52 py-3 px-4 bg-white/95 backdrop-blur-md border border-border/50 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
        <p className="font-sans text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
          Keyboard shortcuts
        </p>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.description} className="flex items-center justify-between gap-3">
              <span className="font-sans text-xs text-text-secondary">{s.description}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-text-muted text-[10px] mx-0.5">/</span>}
                    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-bg-subtle border border-border/60 font-mono text-[10px] text-text-secondary">
                      {k}
                    </kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
