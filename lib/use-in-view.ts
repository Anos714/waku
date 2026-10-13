"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const NOOP = () => {};

/**
 * Reveals an element when it scrolls into view, once.
 *
 * Drives the landing page's staggered entrances: a section starts at rest and
 * gets `animate-fade-up` applied when it enters the viewport. Respects
 * `prefers-reduced-motion` — the CSS global override already collapses the
 * animation to effectively instant, so this hook only decides *when* the class
 * is added, never how long it runs.
 *
 * Returns a ref to attach and a boolean that flips to true on first
 * intersection and stays true.
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = {},
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [store] = useState(() => createStore<T>(options));
  const inView = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  // Attach the observer inside an effect — observing is a side effect, so it
  // must not happen during render.
  useEffect(() => {
    return store.observe(ref.current);
  }, [store]);

  return [ref, inView];
}

interface ViewStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
  observe: (node: HTMLElement | null) => () => void;
}

/**
 * A tiny store over one element's intersection state. `useSyncExternalStore`
 * reads it, so reveals are React-rendered rather than `setState`-ed from an
 * effect. The server snapshot is always false, matching the first client
 * render before the observer has fired.
 */
function createStore<T extends HTMLElement>(options: IntersectionObserverInit): ViewStore {
  let inView = false;
  let node: T | null = null;
  let observer: IntersectionObserver | null = null;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  // Without IntersectionObserver support there is nothing to wait on: reveal
  // immediately so content is never stuck hidden.
  const capable = typeof IntersectionObserver !== "undefined";

  function getSnapshot(): boolean {
    return capable ? inView : true;
  }

  function observe(next: HTMLElement | null): () => void {
    node = next as T | null;
    observer?.disconnect();

    if (!capable || !node) return NOOP;

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!inView) {
            inView = true;
            emit();
          }
          observer?.disconnect();
          break;
        }
      }
    }, options);
    observer.observe(node);

    return () => observer?.disconnect();
  }

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot: () => false,
    observe,
  };
}
