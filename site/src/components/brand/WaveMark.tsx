type Props = {
  height?: number;
  className?: string;
  variant?: "red" | "white";
  title?: string;
};

/**
 * Combined ASSA WAVE branding component.
 * Uses the official white ASSA logo (containing symbol + letters)
 * next to the styled "WAVE" text, keeping them perfectly scaled.
 */
export default function WaveMark({
  height = 28,
  className,
  variant = "red",
  title = "ASSA WAVE",
}: Props) {
  const isWhite = variant === "white";
  const waveFontSize = height * 0.62; // Mathematically matches the ASSA letter height perfectly!

  return (
    <div 
      className={`flex items-center gap-3 select-none ${className || ""}`} 
      style={{ height }}
      title={title}
    >
      {/* Official White Wordmark Logo (contains Play Symbol + ASSA letters) */}
      <img 
        src="/brand/assa-wordmark-white.png" 
        alt="ASSA BI" 
        className="dark:invert-0 invert"
        style={{ 
          height: "100%", 
          width: "auto", 
          objectFit: "contain",
        }}
        draggable={false}
      />

      {/* WAVE Text - Scaled mathematically to match the ASSA letter height */}
      <span 
        className={`font-display font-extrabold uppercase tracking-widest select-none ${
          isWhite 
            ? "text-ink" 
            : "text-brand text-glow-red"
        }`}
        style={{ 
          fontSize: waveFontSize,
          lineHeight: 1,
          letterSpacing: "0.1em"
        }}
      >
        WAVE
      </span>
    </div>
  );
}
