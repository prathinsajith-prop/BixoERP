import { BixoIconsProps, sizeHelper, strokeSizeHelper } from "../bixo-icons";

export default function LiArea({
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
        {/* Outer box */}
        <rect x="4" y="6" width="16" height="12" rx="1" stroke="currentColor" strokeWidth={iconStrokeWidth} />

        {/* Ticks */}
        <path opacity={oneTone ? 1 : 0.6} d="M8 6V10" stroke="currentColor" strokeWidth={iconStrokeWidth} />
        <path opacity={oneTone ? 1 : 0.6} d="M12 6V9" stroke="currentColor" strokeWidth={iconStrokeWidth} />
        <path opacity={oneTone ? 1 : 0.6} d="M16 6V10" stroke="currentColor" strokeWidth={iconStrokeWidth} />

        <path opacity={oneTone ? 1 : 0.6} d="M8 18V14" stroke="currentColor" strokeWidth={iconStrokeWidth} />
        <path opacity={oneTone ? 1 : 0.6} d="M12 18V15" stroke="currentColor" strokeWidth={iconStrokeWidth} />
        <path opacity={oneTone ? 1 : 0.6} d="M16 18V14" stroke="currentColor" strokeWidth={iconStrokeWidth} />
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
      <rect fill="currentColor" x="4" y="6" width="16" height="12" rx="1" />
      <rect opacity={oneTone ? 0 : 0.4} fill="currentColor" x="4" y="14" width="16" height="4" />
    </svg>
  );
}
