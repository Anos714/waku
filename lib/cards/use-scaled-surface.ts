"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Scales a fixed-size design surface to fit its parent width.
 *
 * The inner node keeps its exact design pixel dimensions (so PNG capture is
 * crisp) and is visually reduced via a transform; the outer element reserves
 * the scaled height so layout stays stable. The initial scale is measured
 * synchronously in a layout effect to avoid a frame at full design size.
 */
export function useScaledSurface(designWidth: number, designHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const width = container.clientWidth;
      if (width > 0) setScale(Math.min(1, width / designWidth));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [designWidth]);

  // Until measured, the surface is hidden; the container keeps its aspect ratio
  // via CSS so there is no content shift while the first measurement lands.
  const measured = scale !== null;

  return {
    containerRef,
    scale: measured ? scale : 0,
    measured,
    aspectRatio: `${designWidth} / ${designHeight}`,
  };
}
