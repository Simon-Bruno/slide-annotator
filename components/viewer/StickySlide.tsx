interface StickySlideProps {
  src: string;
  slideNumber: number;
}

export function StickySlide({ src, slideNumber }: StickySlideProps) {
  return (
    <div className="relative">
      <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-accent text-white font-sans text-xs font-medium flex items-center justify-center shadow-md z-10">
        {slideNumber}
      </span>
      <img
        src={src}
        alt={`Slide ${slideNumber}`}
        className="w-full rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      />
    </div>
  );
}
