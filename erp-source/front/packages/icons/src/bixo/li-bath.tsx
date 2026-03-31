import { BixoIconsProps, sizeHelper, strokeSizeHelper } from "../bixo-icons";

export default function LiBath({
  style,
  className,
  variant = "outlined",
  size = "medium",
  oneTone = false,
}: BixoIconsProps) {
  const iconSize = sizeHelper(size);
  const iconStrokeWidth = strokeSizeHelper(iconSize);

  if (variant === "outlined") {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        className={className}
        style={style}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tub base */}
        <rect x="3" y="10" width="18" height="6" rx="3" stroke="currentColor" strokeWidth={iconStrokeWidth} />

        {/* Faucet */}
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M7 6H12C12.5523 6 13 6.44772 13 7V10"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinecap="round"
        />

        {/* Legs */}
        <path d="M6 16V19" stroke="currentColor" strokeWidth={iconStrokeWidth} strokeLinecap="round" />
        <path d="M18 16V19" stroke="currentColor" strokeWidth={iconStrokeWidth} strokeLinecap="round" />
      </svg>
    );
  }

  // FILLED
  return (
    <svg
      width={iconSize}
      height={iconSize}
      className={className}
        style={style}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="currentColor" d="M3 12C3 10.3431 4.34315 9 6 9H18C19.6569 9 21 10.3431 21 12V15H3V12Z" />
      <path opacity={oneTone ? 0 : 0.4} fill="currentColor" d="M6 15H18V19H6V15Z" />
    </svg>
  );
}
