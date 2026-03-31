import { BixoIconsProps, sizeHelper, strokeSizeHelper } from "../bixo-icons";

export default function LiBed({
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
        {/* Bed frame */}
        <rect x="3" y="10" width="18" height="7" rx="1" stroke="currentColor" strokeWidth={iconStrokeWidth} />
        {/* Pillows */}
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M7 10V8C7 7.44772 7.44772 7 8 7H10C10.5523 7 11 7.44772 11 8V10"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
        />
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M13 10V8C13 7.44772 13.4477 7 14 7H16C16.5523 7 17 7.44772 17 8V10"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
        />
        {/* Legs */}
        <path d="M3 17V20" stroke="currentColor" strokeWidth={iconStrokeWidth} strokeLinecap="round" />
        <path d="M21 17V20" stroke="currentColor" strokeWidth={iconStrokeWidth} strokeLinecap="round" />
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
      <path fill="currentColor" d="M3 10C3 8.34315 4.34315 7 6 7H18C19.6569 7 21 8.34315 21 10V17H3V10Z" />
      <path opacity={oneTone ? 0 : 0.4} fill="currentColor" d="M3 17H21V20H3V17Z" />
    </svg>
  );
}
