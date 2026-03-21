"use client";

import { Region } from "@/lib/types";

// Distinct colors for region markers
const REGION_COLORS = [
  "#E07A5F", // terracotta
  "#3D85C6", // blue
  "#81B29A", // sage
  "#F2CC8F", // sand
  "#9B72AA", // purple
];

interface SlideWithHotspotsProps {
  src: string;
  slideNumber: number;
  regions: Region[];
  activeRegion: number | null;
  onRegionHover: (id: number | null) => void;
  onRegionClick: (id: number | null) => void;
}

export function SlideWithHotspots({
  src,
  slideNumber,
  regions,
  activeRegion,
  onRegionHover,
  onRegionClick,
}: SlideWithHotspotsProps) {
  return (
    <div className="relative">
      {/* Slide number badge */}
      <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-accent text-white font-sans text-xs font-medium flex items-center justify-center shadow-md z-10">
        {slideNumber}
      </span>

      {/* Slide image */}
      <img
        src={src}
        alt={`Slide ${slideNumber}`}
        className="w-full rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      />

      {/* Region highlight — only on hover, big and bold */}
      {regions.map((region, i) => {
        const color = REGION_COLORS[i % REGION_COLORS.length];
        const isActive = activeRegion === region.id;

        return (
          <div
            key={region.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 rounded-full ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            style={{
              left: `${region.x * 100}%`,
              top: `${region.y * 100}%`,
              width: "48px",
              height: "48px",
              background: `radial-gradient(circle, ${color}CC 0%, ${color}60 50%, transparent 100%)`,
              boxShadow: `0 0 30px ${color}90, 0 0 60px ${color}50`,
            }}
          />
        );
      })}

      {/* Edge notches on the right side of the slide */}
      {regions.map((region, i) => (
        <button
          key={`notch-${region.id}`}
          type="button"
          onMouseEnter={() => onRegionHover(region.id)}
          onMouseLeave={() => onRegionHover(null)}
          onClick={() => onRegionClick(activeRegion === region.id ? null : region.id)}
          className={`
            absolute -right-3 w-6 h-6 -translate-y-1/2
            rounded-full font-sans text-[10px] font-bold
            flex items-center justify-center
            transition-all duration-200 cursor-pointer z-10
            ${activeRegion === region.id ? "scale-125 shadow-md" : "hover:scale-110"}
          `}
          style={{
            top: `${region.y * 100}%`,
            backgroundColor: REGION_COLORS[i % REGION_COLORS.length],
            color: "white",
            border: `2px solid ${REGION_COLORS[i % REGION_COLORS.length]}`,
            boxShadow: activeRegion === region.id
              ? `0 0 12px ${REGION_COLORS[i % REGION_COLORS.length]}60`
              : "none",
          }}
          title={region.label}
        >
          {region.id}
        </button>
      ))}
    </div>
  );
}

export { REGION_COLORS };
