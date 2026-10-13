import { initials } from "@/lib/profile/format";

/**
 * Generated fallback avatar: a monogram on a two-tone surface derived from the
 * name. Used whenever a profile has no photo, or when a photo fails to load.
 */
export function MonogramAvatar({
  name,
  size,
  className,
  radius,
  style,
}: {
  name: string;
  size: number;
  className?: string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  const text = initials(name);
  // Deterministic hue from the name so every profile feels distinct.
  const hue = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  return (
    <div
      className={className}
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(150deg,
          hsl(${hue} 38% 22%),
          hsl(${(hue + 40) % 360} 30% 12%))`,
        color: `hsl(${hue} 60% 88%)`,
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        letterSpacing: "0.02em",
        fontSize: size * 0.4,
        lineHeight: 1,
        userSelect: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {text}
    </div>
  );
}
