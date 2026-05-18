import { useEffect, useState } from "react";

/**
 * Returns true once the window has scrolled past `threshold` px.
 *
 * Intentionally does NOT read window.scrollY on mount — this prevents a
 * flash of the "scrolled" state caused by stale scrollY carried over from a
 * previous route before the browser resets the scroll position on navigation.
 */
export function useScrolled(threshold = 8) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Reset to unscrolled whenever the effect re-runs (e.g. route change
    // causes remount) so we never inherit position from the previous page.
    setIsScrolled(false);

    const handler = () => setIsScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
    };
  }, [threshold]);

  return isScrolled;
}
