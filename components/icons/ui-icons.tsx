import type { ReactNode, SVGProps } from "react";

/**
 * Waku UI icons — a hand-built duo-solid set drawn on a 24×24 grid.
 *
 * Style rules:
 * - Two tones of one colour: a solid primary shape over a 30% tinted one.
 * - Corners are softened by pairing fills with a matching round stroke.
 * - Linear glyphs (checks, arrows, arcs) keep a 3px optical weight.
 *
 * The API mirrors the icon components this set replaced: every icon takes
 * standard SVG props, inherits `currentColor`, and is sized by the caller
 * (`className` on buttons, tooltips, tabs…).
 */

type IconProps = SVGProps<SVGSVGElement>;

const TINT = 0.3;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Solid shape: fill plus a matching round stroke, so joins read softly. */
function Solid({ d, w = 2 }: { d: string; w?: number }) {
  return (
    <path
      d={d}
      stroke="currentColor"
      strokeWidth={w}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

/** The duo layer: same drawing language at 30% of the current colour. */
function Tint({ d, w = 2 }: { d: string; w?: number }) {
  return (
    <path
      d={d}
      fillOpacity={TINT}
      stroke="currentColor"
      strokeOpacity={TINT}
      strokeWidth={w}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

/** Open stroke glyph — checks, chevrons, arcs, rules. */
function Line({ d, w = 3 }: { d: string; w?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function TintedCircle({ r, w = 2 }: { r: number; w?: number }) {
  return (
    <circle
      cx="12"
      cy="12"
      r={r}
      fill="none"
      stroke="currentColor"
      strokeOpacity={TINT}
      strokeWidth={w}
    />
  );
}

function TintedDisc({ r, w = 2 }: { r: number; w?: number }) {
  return (
    <circle
      cx="12"
      cy="12"
      r={r}
      fillOpacity={TINT}
      stroke="currentColor"
      strokeOpacity={TINT}
      strokeWidth={w}
    />
  );
}

/* ------------------------------------------------------------------ alerts */

export function AlertTriangle(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M12 4.6 21.4 20.2H2.6Z" w={2.4} />
      <rect x="10.8" y="9.6" width="2.4" height="6.2" rx="1.2" />
      <circle cx="12" cy="18.4" r="1.4" />
    </Base>
  );
}

export function Info(props: IconProps) {
  return (
    <Base {...props}>
      <TintedDisc r={8.8} />
      <rect x="10.8" y="10.6" width="2.4" height="7" rx="1.2" />
      <circle cx="12" cy="7.4" r="1.5" />
    </Base>
  );
}

/* ------------------------------------------------------------------ arrows */

export function ArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <Solid d="M20.4 12 12.1 17.2v-4.6H3.6v-1.2h8.5V6.8Z" />
    </Base>
  );
}

export function ArrowUp(props: IconProps) {
  return (
    <Base {...props}>
      <Solid d="M12 4 18.6 12.2h-6V20h-1.2v-7.8H5.4Z" />
    </Base>
  );
}

export function ArrowDown(props: IconProps) {
  return (
    <Base {...props}>
      <Solid d="M12 20 5.4 11.8h6V4h1.2v7.8h6Z" />
    </Base>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="3.7"
        y="12.78"
        width="12.94"
        height="3"
        rx="1.5"
        transform="rotate(-45 10.175 14.28)"
      />
      <Solid d="M19.7 4.3 11.21 5.71 18.29 12.79Z" />
    </Base>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Base {...props}>
      <Line d="M6.6 9.4 12 14.8 17.4 9.4" />
    </Base>
  );
}

/* ------------------------------------------------------------------ status */

export function Check(props: IconProps) {
  return (
    <Base {...props}>
      <Line d="M5.5 12.6 10.1 17.2 18.6 7.4" />
    </Base>
  );
}

export function X(props: IconProps) {
  return (
    <Base {...props}>
      <Line d="M6.4 6.4 17.6 17.6" />
      <Line d="M17.6 6.4 6.4 17.6" />
    </Base>
  );
}

export function Loader2(props: IconProps) {
  return (
    <Base {...props}>
      <TintedCircle r={8} w={3} />
      <Line d="M20 12A8 8 0 0 1 9.26 19.52" w={3.6} />
    </Base>
  );
}

export function Clock(props: IconProps) {
  return (
    <Base {...props}>
      <TintedDisc r={8.8} />
      <Line d="M12 7.2V12.3l3.9 2.2" w={2.6} />
    </Base>
  );
}

export function RotateCcw(props: IconProps) {
  return (
    <Base {...props}>
      <TintedCircle r={8} w={3} />
      <Line d="M9.26 4.48A8 8 0 1 1 4.48 9.26" w={3.2} />
      <Solid d="M3 13.4 2 6.7 8.1 8.9Z" w={1.6} />
    </Base>
  );
}

/* ------------------------------------------------------------ files & media */

export function FileText(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M4.2 3.6h9.4l6.2 6.2v10.6H4.2Z" w={2.4} />
      <Solid d="M13.6 3.6v6.2h6.2Z" w={1.6} />
      <Line d="M7.8 13.6h8.4" w={2.4} />
      <Line d="M7.8 17.2h5.6" w={2.4} />
    </Base>
  );
}

export function FileQuestion(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M4.2 3.6h9.4l6.2 6.2v10.6H4.2Z" w={2.4} />
      <Solid d="M13.6 3.6v6.2h6.2Z" w={1.6} />
      <Line d="M9.8 12.6a2.4 2.4 0 1 1 3.6 2.1c-1 .6-1.5 1.2-1.5 2.3" w={2.4} />
      <circle cx="11.9" cy="19.1" r="1.25" />
    </Base>
  );
}

export function ImagePlus(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="2.6"
        y="8.6"
        width="11.8"
        height="11.8"
        rx="3"
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="2"
      />
      <circle cx="6.6" cy="12.6" r="1.6" />
      <Solid d="M4.2 19.4 7.8 15l2.3 2.6 1.7-1.9 2.4 3.7Z" w={1.6} />
      <Line d="M18.4 3v6.4" w={2.6} />
      <Line d="M15.2 6.2h6.4" w={2.6} />
    </Base>
  );
}

export function Copy(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="9"
        y="3.6"
        width="11.4"
        height="13.6"
        rx="2.6"
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="2"
      />
      <rect
        x="3.6"
        y="6.8"
        width="11.4"
        height="13.6"
        rx="2.6"
        stroke="currentColor"
        strokeWidth="2"
      />
    </Base>
  );
}

export function Download(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M4.6 15.4h14.8v3.2a2.2 2.2 0 0 1-2.2 2.2H6.8a2.2 2.2 0 0 1-2.2-2.2Z" />
      <Solid d="M12 4.4 17.6 10.6h-4.9v3.6h-1.4v-3.6H6.4Z" />
    </Base>
  );
}

export function ExternalLink(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="3.4"
        y="8"
        width="12.6"
        height="12.4"
        rx="3.2"
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="2"
      />
      <rect
        x="8.02"
        y="10.27"
        width="9.43"
        height="3"
        rx="1.5"
        transform="rotate(-45 12.735 11.765)"
      />
      <Solid d="M20.6 3.6 12.68 4.74 19.46 11.52Z" />
    </Base>
  );
}

export function Eye(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M3.4 12C5.8 7.6 8.7 5.5 12 5.5S18.2 7.6 20.6 12C18.2 16.4 15.3 18.5 12 18.5S5.8 16.4 3.4 12Z" w={2.4} />
      <circle cx="12" cy="12" r="3.1" />
    </Base>
  );
}

export function EyeOff(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M3.4 12C5.8 7.6 8.7 5.5 12 5.5S18.2 7.6 20.6 12C18.2 16.4 15.3 18.5 12 18.5S5.8 16.4 3.4 12Z" w={2.4} />
      <Line d="M4.6 4.6 19.4 19.4" />
    </Base>
  );
}

export function Frame(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6.6" y="7.6" width="10.8" height="8.8" rx="1.6" fillOpacity={TINT} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.6 3.4h10.8a3.2 3.2 0 0 1 3.2 3.2v10.8a3.2 3.2 0 0 1-3.2 3.2H6.6a3.2 3.2 0 0 1-3.2-3.2V6.6a3.2 3.2 0 0 1 3.2-3.2Zm1.6 4.2a1.6 1.6 0 0 0-1.6 1.6v5.6a1.6 1.6 0 0 0 1.6 1.6h7.6a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6H8.2Z"
      />
    </Base>
  );
}

export function LayoutGrid(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.4" y="3.4" width="8" height="8" rx="2.4" />
      <rect x="12.6" y="3.4" width="8" height="8" rx="2.4" fillOpacity={TINT} />
      <rect x="3.4" y="12.6" width="8" height="8" rx="2.4" fillOpacity={TINT} />
      <rect x="12.6" y="12.6" width="8" height="8" rx="2.4" />
    </Base>
  );
}

export function QrCode(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="3.4"
        y="3.4"
        width="17.2"
        height="17.2"
        rx="4"
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="2"
      />
      <rect x="6.4" y="6.4" width="4.8" height="4.8" rx="1.4" />
      <rect x="12.8" y="6.4" width="4.8" height="4.8" rx="1.4" />
      <rect x="6.4" y="12.8" width="4.8" height="4.8" rx="1.4" />
      <rect x="12.8" y="12.8" width="2.6" height="2.6" rx="0.9" />
      <rect x="12.8" y="16.6" width="2.6" height="2.6" rx="0.9" />
      <rect x="16.6" y="16.6" width="2.6" height="2.6" rx="0.9" />
    </Base>
  );
}

export function Trash2(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M5.8 7.4h12.4l-1 12.2H6.8Z" />
      <Line d="M10.4 10.8v6" w={2.2} />
      <Line d="M13.6 10.8v6" w={2.2} />
      <rect x="9.6" y="2.4" width="4.8" height="2.2" rx="1.1" />
      <rect x="3.6" y="4.2" width="16.8" height="3.4" rx="1.7" />
    </Base>
  );
}

/* ------------------------------------------------------------- design tools */

export function Palette(props: IconProps) {
  return (
    <Base {...props}>
      <path
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="2"
        strokeLinejoin="round"
        fillRule="evenodd"
        d="M3.2 12a8.8 8.8 0 1 0 17.6 0 8.8 8.8 0 1 0-17.6 0Zm10.6 3.6a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0Z"
      />
      <circle cx="7.8" cy="12.4" r="1.6" />
      <circle cx="11.2" cy="7.6" r="1.6" />
      <circle cx="15.6" cy="8.8" r="1.6" />
    </Base>
  );
}

export function Sparkles(props: IconProps) {
  return (
    <Base {...props}>
      <Solid d="M14.6 3.2 16.5 7.5 20.8 9.4 16.5 11.3 14.6 15.6 12.7 11.3 8.4 9.4 12.7 7.5Z" w={1} />
      <path
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="1"
        strokeLinejoin="round"
        d="M6.2 14.6 7.2 16.8 9.4 17.8 7.2 18.8 6.2 21 5.2 18.8 3 17.8 5.2 16.8Z"
      />
    </Base>
  );
}

export function Wand2(props: IconProps) {
  return (
    <Base {...props}>
      <path
        fillOpacity={TINT}
        stroke="currentColor"
        strokeOpacity={TINT}
        strokeWidth="1"
        strokeLinejoin="round"
        d="M5.6 2.6 6.5 4.5 8.4 5.4 6.5 6.3 5.6 8.2 4.7 6.3 2.8 5.4 4.7 4.5Z"
      />
      <Line d="M5.8 18.6 14.4 10" w={3.6} />
      <Solid d="M17 2.6 18.5 5.9 21.8 7.4 18.5 8.9 17 12.2 15.5 8.9 12.2 7.4 15.5 5.9Z" w={1} />
    </Base>
  );
}

/* ---------------------------------------------------------- media playback */

export function Play(props: IconProps) {
  return (
    <Base {...props}>
      <TintedDisc r={8.8} />
      <Solid d="M9.8 7.6 16.9 12l-7.1 4.4Z" w={1.8} />
    </Base>
  );
}

export function Pause(props: IconProps) {
  return (
    <Base {...props}>
      <TintedDisc r={8.8} />
      <rect x="8.8" y="7.8" width="2.4" height="8.4" rx="1.2" />
      <rect x="13" y="7.8" width="2.4" height="8.4" rx="1.2" />
    </Base>
  );
}

export function Volume2(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M4.6 9.4h3.2L12.6 6v12l-4.8-3.4H4.6Z" w={2} />
      <Line d="M15.7 9.5a3.7 3.7 0 0 1 0 5" w={2.4} />
      <Line d="M18.3 7.3a7 7 0 0 1 0 9.4" w={2.4} />
    </Base>
  );
}

export function VolumeX(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M4.6 9.4h3.2L12.6 6v12l-4.8-3.4H4.6Z" w={2} />
      <Line d="m16.2 9.9 4.4 4.2" w={2.6} />
      <Line d="m20.6 9.9-4.4 4.2" w={2.6} />
    </Base>
  );
}

/* ------------------------------------------------------------------ sharing */

export function Globe(props: IconProps) {
  return (
    <Base {...props}>
      <TintedDisc r={8.8} />
      <Line d="M3.6 12h16.8" w={2.4} />
      <Line d="M12 3.4c-2.6 2.4-4 5.4-4 8.6s1.4 6.2 4 8.6c2.6-2.4 4-5.4 4-8.6s-1.4-6.2-4-8.6Z" w={2.4} />
    </Base>
  );
}

export function MapPin(props: IconProps) {
  return (
    <Base {...props}>
      <Tint d="M12 3.4c-4.2 0-7.6 3.3-7.6 7.5 0 5.3 6.2 9.7 6.9 10.3a1.2 1.2 0 0 0 1.4 0c.7-.6 6.9-5 6.9-10.3 0-4.2-3.4-7.5-7.6-7.5Z" w={2.4} />
      <circle cx="12" cy="10.6" r="3" />
    </Base>
  );
}

export function Share2(props: IconProps) {
  return (
    <Base {...props}>
      <Line d="M9.52 10.21 14.48 7.39" w={2.6} />
      <Line d="M9.52 13.79 14.48 16.61" w={2.6} />
      <circle cx="17.6" cy="5.6" r="3.1" />
      <circle cx="6.4" cy="12" r="3.1" />
      <circle cx="17.6" cy="18.4" r="3.1" />
    </Base>
  );
}

/* --------------------------------------------------------------- brand marks
   The only third-party marks the UI draws: the two social sign-in providers.
   Unlike the rest of this set they are multi-colour and carry their own fills,
   so they bypass `Base` and set an explicit viewBox.
*/

export function GoogleMark({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.846-.07-1.65-.2-2.418H12v4.575h6.456a5.52 5.52 0 0 1-2.391 3.621v3.01h3.864c2.26-2.081 3.591-5.15 3.591-8.788Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.234 0 5.946-1.072 7.929-2.908l-3.864-3.01c-1.072.72-2.444 1.146-4.065 1.146-3.124 0-5.772-2.112-6.72-4.957H1.29v3.107A11.997 11.997 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.271A7.2 7.2 0 0 1 4.891 12c0-.792.137-1.564.378-2.271V6.622H1.29A11.997 11.997 0 0 0 0 12c0 1.937.464 3.769 1.29 5.379l3.99-3.108Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.772c1.758 0 3.336.604 4.578 1.79l3.42-3.42C17.94 1.184 15.23 0 12 0A11.997 11.997 0 0 0 1.29 6.622l3.99 3.107C6.228 6.884 8.876 4.772 12 4.772Z"
      />
    </svg>
  );
}

export function LogOut(props: IconProps) {
  return (
    <Base {...props}>
      <Line d="M14 4.5H6.2A1.7 1.7 0 0 0 4.5 6.2v11.6a1.7 1.7 0 0 0 1.7 1.7H14" w={2.4} />
      <Line d="M17.6 8.6 21 12l-3.4 3.4" w={2.4} />
      <Line d="M10.6 12H20.8" w={2.4} />
    </Base>
  );
}
