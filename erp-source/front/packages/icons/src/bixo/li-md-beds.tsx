import { BixoIconsProps, sizeHelper, strokeSizeHelper } from "../bixo-icons";

export default function LiMdBeds({
  style,
  className,
  variant = "outlined",
  size = "medium",
  oneTone = false,
}: BixoIconsProps) {
  const iconSize = sizeHelper(size);
  const iconStrokeWidth = strokeSizeHelper(iconSize);

  // Filled path from provided MDI SVG
  const filledPath =
    "M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3s1.34 3 3 3m0-4c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1m12-3h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4m2 8h-8V9h6c1.1 0 2 .9 2 2Z";

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
        {/* Bed head / structure */}
        <path
          d="M1 20V5h2v11h8V6h8c2.2 0 4 1.8 4 4v9h-2v-3H3v3H1Z"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinejoin="round"
        />

        {/* Pillow circle */}
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3s1.34 3 3 3Z"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner dot */}
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M7 10c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1Z"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinecap="round"
        />

        {/* Right-side frame area */}
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M21 13h-8V9h6c1.1 0 2 .9 2 2v2Z"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinejoin="round"
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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={filledPath} />
    </svg>
  );
}
