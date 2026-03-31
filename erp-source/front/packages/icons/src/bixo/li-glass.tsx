import { BixoIconsProps, sizeHelper, strokeSizeHelper } from "../bixo-icons";

export default function LiGlass({
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
        {/* Top curves */}
        <path
          d="M12 12l2.958-2.929c2.922-2.894 4.383-4.341 3.974-5.59a2 2 0 0 0-.13-.312C18.2 2 16.133 2 12 2S5.8 2 5.198 3.17q-.078.15-.13.311C4.838 4.184 5.199 4.95 6.08 6"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinecap="round"
        />

        {/* Bottom curves */}
        <path
          d="M12 12l-2.958 2.929c-2.922 2.894-4.383 4.341-3.974 5.59q.052.16.13.312C5.8 22 7.867 22 12 22s6.2 0 6.802-1.17q.078-.15.13-.311c.23-.703-.131-1.468-1.013-2.519"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinecap="round"
        />

        {/* Cross-lines */}
        <path
          opacity={oneTone ? 1 : 0.6}
          d="M12 12l2.958 2.929M12 12L9.042 9.071"
          stroke="currentColor"
          strokeWidth={iconStrokeWidth}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // FILLED VERSION
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
      {/* Main filled shape */}
      <path
        fill="currentColor"
        d="M12 2c4.133 0 6.2 0 6.802 1.17.118.226.196.47.23.723.138 1.041-.977 2.145-3.764 4.863L12 12l3.268 3.244c2.787 2.718 3.902 3.822 3.764 4.863a2 2 0 0 1-.23.723C18.2 22 16.133 22 12 22s-6.2 0-6.802-1.17a2 2 0 0 1-.23-.723c-.138-1.041.977-2.145 3.764-4.863L12 12 8.732 8.756C5.945 6.038 4.83 4.934 4.968 3.893a2 2 0 0 1 .23-.723C5.8 2 7.867 2 12 2Z"
      />

      {/* Inner strokes */}
      <path
        opacity={oneTone ? 0 : 0.4}
        stroke="currentColor"
        strokeWidth={iconStrokeWidth}
        strokeLinecap="round"
        d="M12 12l3 3M12 12l-3-3"
      />
    </svg>
  );
}
