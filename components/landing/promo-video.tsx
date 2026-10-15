"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "@/components/icons/ui-icons";
import { useInView } from "@/lib/use-in-view";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/media/waku-promo.mp4";
const POSTER_SRC = "/media/waku-promo-poster.webp";

/**
 * The product tour video. The file is a re-encoded 1080p H.264 with faststart,
 * so the moov atom sits at the front and playback can begin mid-download.
 *
 * Nothing is fetched until the card is mostly on screen: `preload="none"` keeps
 * even the byte range request out of the initial load, the poster holds the
 * frame (and the layout — the element carries width/height) until then, and an
 * IntersectionObserver plays while visible and pauses the moment it scrolls
 * away. Autoplay is always muted; the sound is a visitor choice behind the
 * volume button, and `prefers-reduced-motion` gets a poster and a play button
 * instead of a running loop.
 */
export function PromoVideo() {
  const [headingRef, headingInView] = useInView<HTMLDivElement>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  // The observer callback must not resubscribe on every state change, so the
  // reduced-motion flag it reads lives in a ref, refreshed by an effect.
  const autoplayRef = useRef(false);
  useEffect(() => {
    autoplayRef.current = !reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video || typeof IntersectionObserver === "undefined") return;

    // `muted` is a React property, not a server-rendered attribute — set it on
    // the real element before anything can autoplay, then leave it alone so a
    // visitor's volume choice survives re-renders.
    video.muted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // A reduced-motion visitor starts the video themselves; an unmuted
          // resume without a gesture is refused by the browser, which the
          // catch turns back into the paused poster state.
          if (!autoplayRef.current && !video.dataset.started) return;
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.55 },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    video.dataset.started = "1";
    if (video.paused) {
      setBuffering(true);
      void video.play().catch(() => setBuffering(false));
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    // Unmuting is a user gesture, so a paused clip can start with sound.
    if (!next && video.paused) {
      video.dataset.started = "1";
      void video.play().catch(() => {});
    }
  };

  return (
    <section id="watch" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div
          ref={headingRef}
          className={cn(
            "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
            headingInView ? "animate-fade-up" : "opacity-0",
          )}
        >
          <div>
            <p className="eyebrow text-ink-3">Watch</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Thirty seconds, the whole flow.
            </h2>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-accent)" }}
              aria-hidden="true"
            />
            details → theme → live link
          </span>
        </div>

        <div
          ref={wrapRef}
          className="group/video relative mt-10 overflow-hidden rounded-2xl border border-line bg-bg-deep shadow-card"
        >
          <video
            ref={videoRef}
            className="block aspect-video h-auto w-full"
            width={1920}
            height={1080}
            poster={POSTER_SRC}
            preload="none"
            muted
            loop
            playsInline
            disablePictureInPicture
            aria-label="Product tour: build a profile in the editor and publish it to a live link"
            onPlay={() => {
              setPlaying(true);
              setBuffering(false);
            }}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onError={() => {
              setFailed(true);
              setBuffering(false);
            }}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>

          {/* Full-surface control: pointer and keyboard both hit the same
              toggle, and the video has no native chrome to fight with. */}
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Pause the product tour" : "Play the product tour"}
            className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
          >
            {!playing && !buffering ? (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-card-lg transition-transform duration-200 group-hover/video:scale-105 md:h-16 md:w-16">
                <Play className="h-6 w-6 translate-x-0.5 md:h-7 md:w-7" />
              </span>
            ) : null}
            {playing && !buffering ? (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover/video:opacity-100 group-focus-within/video:opacity-100 md:h-14 md:w-14">
                <Pause className="h-5 w-5 md:h-6 md:w-6" />
              </span>
            ) : null}
          </button>

          {buffering ? (
            <span
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
              aria-hidden="true"
            >
              <Loader2 className="h-8 w-8 animate-spin text-white/80" />
            </span>
          ) : null}

          <span className="pointer-events-none absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[0.6875rem] text-white/75 backdrop-blur md:top-4 md:left-4">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-accent)" }}
              aria-hidden="true"
            />
            0:30 product tour
          </span>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute the product tour" : "Mute the product tour"}
            className="absolute right-3 bottom-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/85 backdrop-blur transition-colors duration-200 hover:bg-black/65 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-4 md:bottom-4"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {failed ? (
          <p className="mt-4 text-sm text-ink-3">
            Your browser can’t play this clip inline.{" "}
            <a
              href={VIDEO_SRC}
              className="font-medium text-ink-2 underline underline-offset-4 transition-colors hover:text-ink"
            >
              open the video directly
            </a>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
