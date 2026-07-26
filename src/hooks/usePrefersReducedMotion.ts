import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the OS-level "reduce motion" accessibility setting.
 *
 * The CSS side of this is handled by @media queries, but animation driven
 * from JS (useFrame loops, timers) has to check it explicitly.
 */
export function usePrefersReducedMotion() {
  // Lazy initialiser so matchMedia only runs on the first render, not on
  // every subsequent one.
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    // Without this, toggling the setting after unmount would call
    // setState on a dead component — and every remount would stack
    // another listener on the same MediaQueryList.
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}
