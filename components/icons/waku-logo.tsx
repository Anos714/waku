import { useId } from "react";
import type { SVGProps } from "react";

export type WakuLogoVariant = "mascot" | "mark" | "markLight";

const MARK_BODY = "#1a1a16";
const MARK_BAR = "#f5f3ee";

/**
 * The Waku brand mark.
 *
 * - `mascot` — the full character, use from 24px up
 * - `mark` — compact tile for light surfaces
 * - `markLight` — compact tile for dark surfaces
 */
export function WakuLogo({
  variant = "mascot",
  ...props
}: SVGProps<SVGSVGElement> & { variant?: WakuLogoVariant }) {
  const uid = useId().replace(/:/g, "");
  const bodyId = `waku-body-${uid}`;
  const headId = `waku-head-${uid}`;

  if (variant !== "mascot") {
    const dark = variant === "mark";
    return (
      <svg
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        <rect
          x="16"
          y="16"
          width="480"
          height="480"
          rx="128"
          fill={dark ? MARK_BODY : MARK_BAR}
        />
        <circle cx="256" cy="176" r="112" fill="#c6f24e" />
        <ellipse cx="186" cy="204" rx="18" ry="10" fill="#a3d021" fillOpacity="0.9" />
        <ellipse cx="326" cy="204" rx="18" ry="10" fill="#a3d021" fillOpacity="0.9" />
        <ellipse cx="216" cy="166" rx="17" ry="22" fill="#1a1a16" />
        <ellipse cx="296" cy="166" rx="17" ry="22" fill="#1a1a16" />
        <circle cx="222" cy="157" r="6" fill="#fffdf9" />
        <circle cx="302" cy="157" r="6" fill="#fffdf9" />
        <path
          d="M219 216 Q256 246 293 216"
          fill="none"
          stroke="#1a1a16"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <rect x="136" y="330" width="240" height="44" rx="22" fill={dark ? MARK_BAR : MARK_BODY} />
        <rect
          x="136"
          y="400"
          width="160"
          height="34"
          rx="17"
          fill={dark ? MARK_BAR : MARK_BODY}
          fillOpacity={dark ? 0.55 : 0.45}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a22" />
          <stop offset="1" stopColor="#131310" />
        </linearGradient>
        <linearGradient id={headId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#d9ff70" />
          <stop offset="1" stopColor="#b4e231" />
        </linearGradient>
      </defs>

      <g stroke="#f5f3ee" strokeOpacity="0.16" strokeWidth="6">
        <rect x="174" y="428" width="66" height="58" rx="29" fill="#131310" />
        <rect x="272" y="428" width="66" height="58" rx="29" fill="#131310" />
        <rect
          x="74"
          y="276"
          width="58"
          height="104"
          rx="29"
          fill="#131310"
          transform="rotate(-16 103 328)"
        />
        <rect
          x="380"
          y="276"
          width="58"
          height="104"
          rx="29"
          fill="#131310"
          transform="rotate(16 409 328)"
        />
      </g>

      <rect
        x="112"
        y="214"
        width="288"
        height="236"
        rx="52"
        fill={`url(#${bodyId})`}
        stroke="#f5f3ee"
        strokeOpacity="0.16"
        strokeWidth="6"
      />
      <rect x="158" y="302" width="196" height="30" rx="15" fill="#f5f3ee" />
      <rect x="158" y="350" width="130" height="22" rx="11" fill="#f5f3ee" fillOpacity="0.55" />
      <rect x="158" y="388" width="164" height="22" rx="11" fill="#f5f3ee" fillOpacity="0.3" />

      <circle
        cx="366"
        cy="250"
        r="32"
        fill="#c6f24e"
        stroke="#131310"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M352 251l10 10 19-22"
        fill="none"
        stroke="#1a1a16"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path d="M256 82 V52" stroke="#131310" strokeWidth="17" strokeLinecap="round" />
      <circle cx="256" cy="34" r="19" fill="#c6f24e" stroke="#131310" strokeWidth="9" />

      <circle cx="256" cy="176" r="98" fill={`url(#${headId})`} />
      <ellipse cx="194" cy="198" rx="17" ry="10" fill="#a3d021" fillOpacity="0.9" />
      <ellipse cx="318" cy="198" rx="17" ry="10" fill="#a3d021" fillOpacity="0.9" />
      <ellipse cx="221" cy="163" rx="15.5" ry="20" fill="#1a1a16" />
      <ellipse cx="291" cy="163" rx="15.5" ry="20" fill="#1a1a16" />
      <circle cx="226.5" cy="155" r="5.5" fill="#fffdf9" />
      <circle cx="296.5" cy="155" r="5.5" fill="#fffdf9" />
      <path
        d="M225 205 Q256 232 287 205"
        fill="none"
        stroke="#1a1a16"
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  );
}
