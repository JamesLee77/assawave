type Props = {
  /** Height in pixels. Width adjusts automatically. */
  size?: number;
  className?: string;
};

/**
 * Combined ASSA WAVE branding component for the portal.
 * Uses the official white ASSA logo (containing symbol + letters)
 * next to the styled "WAVE" text, keeping them perfectly scaled.
 */
export default function Wordmark({ size = 28, className }: Props) {
  const waveFontSize = size * 0.62; // Mathematically matches the ASSA letter height perfectly!

  return (
    <div 
      className={`flex items-center gap-3 select-none ${className || ""}`} 
      style={{ height: size }}
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

      {/* WAVE Text */}
      <span 
        className="font-display font-extrabold uppercase tracking-widest text-ink"
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
