import { BixoIconsProps, sizeHelper, strokeSizeHelper } from "../bixo-icons";

export default function LiPrice({
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
        {/* Tag shape */}
        <path
          d="M4 7L12 3L20 7V17L12 21L4 17V7Z"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinejoin="round"
        />

        {/* Price dot */}
        <circle
          opacity={oneTone ? 1 : 0.6}
          cx="12"
          cy="12"
          r="1.5"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
        />
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
      <path fill="currentColor" d="M4 7L12 3L20 7V17L12 21L4 17V7Z" />
      <circle opacity={oneTone ? 0 : 0.4} cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
